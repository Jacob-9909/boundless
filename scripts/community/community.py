"""
A week of Boundless community activity, simulated with MiroFish (OASIS multi-agent Reddit simulation).

Every account and post this makes is FICTIONAL (@example.com). It exists so a demo or a judge sees a
community that has been talking for a week, not an empty board.

Steps (run in order, from the repo root, with MiroFish's Python environment):
  personas  cast of foreign residents (fixed skeleton below) -> LLM fills each life -> scripts/community/personas.json
  build     personas.json -> .sim/reddit_profiles.json + .sim/simulation_config.json (MiroFish's input format)
  run       MiroFish's run_reddit_simulation.py over 7 simulated days, recording which round each row came from
  export    .sim/reddit_simulation.db -> LLM labels each post (board, 말머리, title, language) -> db/community.sql

Setup:
  git clone https://github.com/ByeongkiJeong/MiroFish-Ko.git && (cd MiroFish-Ko/backend && uv sync --python 3.11)
  export MIROFISH_DIR=/path/to/MiroFish-Ko NIM_KEY=<NVIDIA NIM key>
  $MIROFISH_DIR/backend/.venv/bin/python scripts/community/community.py personas|build|run|export

LLM: NVIDIA NIM (OpenAI-compatible), z-ai/glm-5.3-flash: it returns tool calls, which OASIS agents act through.
Load the result locally with: DATABASE_URL=<local db> node scripts/db.mjs db/community.sql (after db/seed.sql).
"""

import asyncio
import json
import os
import random
import re
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
SIM = ROOT / ".sim"
PERSONAS = HERE / "personas.json"
OUT_SQL = ROOT / "db" / "community.sql"
BASE_URL = "https://integrate.api.nvidia.com/v1"
MODEL = os.environ.get("NIM_MODEL", "z-ai/glm-5.3-flash")
DAYS = 7
MINUTES_PER_ROUND = 120  # 84 rounds; each picks a few agents awake at that hour

BOARDS = {
    "chat": ["chat", "question", "worry", "funny"],
    "love": ["worry", "story", "advice", "couple"],
    "market": ["sell", "buy", "free"],
    "food": ["recommend", "review", "question", "home"],
    "popup": ["info", "review", "together"],
    "trip": ["recommend", "review", "together", "question"],
    "korean": ["question", "tip", "study"],
    "transit": ["question", "info", "review"],
    "visa": ["question", "info", "review"],
    "housing": ["question", "info", "review", "roommate"],
    "health": ["question", "info", "review"],
    "work": ["question", "hiring", "seeking", "review"],
}
LANG_NAME = {"ko": "Korean", "en": "English", "zh": "Simplified Chinese", "vi": "Vietnamese", "th": "Thai", "uz": "Uzbek (Latin)", "mn": "Mongolian (Cyrillic)",
             "fil": "Filipino/Tagalog", "ne": "Nepali", "id": "Indonesian", "ja": "Japanese", "km": "Khmer", "kk": "Kazakh", "ru": "Russian", "fr": "French", "hi": "Hindi"}
# Hours a member is usually on their phone, by life pattern.
HOURS = {
    "factory": [6, 7, 12, 19, 20, 21, 22, 23],
    "farm": [5, 6, 12, 19, 20, 21],
    "student": [0, 1, 10, 11, 13, 15, 16, 18, 21, 22, 23],
    "office": [7, 8, 12, 13, 18, 19, 21, 22, 23],
    "parent": [9, 10, 11, 13, 14, 15, 21, 22],
    "service": [10, 11, 15, 16, 22, 23, 0, 1],
}

# The cast: (country, writes in, region id, visa id, life pattern, who they are). Weighted toward the
# largest foreign-resident groups in Korea; writing language mixes native, Korean and English.
CAST = [
    ("CN", "zh", "seoul", "d2", "student", "grad student in engineering"),
    ("CN", "ko", "gyeonggi", "f4", "service", "Korean-Chinese (Joseonjok) restaurant manager in Ansan"),
    ("CN", "zh", "seoul", "e7", "office", "marketer at a cosmetics company"),
    ("CN", "ko", "incheon", "f6", "parent", "married to a Korean, child in elementary school"),
    ("CN", "zh", "busan", "d2", "student", "exchange student who loves the sea"),
    ("VN", "vi", "gyeonggi", "e9", "factory", "factory worker in Hwaseong"),
    ("VN", "vi", "seoul", "d4", "student", "language-school student saving for university"),
    ("VN", "ko", "jeonnam", "f6", "parent", "marriage migrant on a farm, two kids"),
    ("VN", "vi", "daegu", "e9", "factory", "textile factory worker"),
    ("VN", "en", "seoul", "d10", "office", "job seeker after a master's degree"),
    ("TH", "th", "gyeonggi", "e9", "farm", "greenhouse farm worker near Icheon"),
    ("TH", "th", "seoul", "d4", "student", "Korean-language student and K-pop fan"),
    ("TH", "en", "busan", "e7", "service", "hotel front desk staff"),
    ("US", "en", "seoul", "etc", "office", "English teacher in Gangnam"),
    ("US", "en", "gyeonggi", "etc", "parent", "military spouse in Pyeongtaek"),
    ("US", "ko", "seoul", "f5", "office", "permanent resident, game developer, fluent Korean"),
    ("UZ", "uz", "gyeonggi", "e9", "factory", "factory worker in Gimpo"),
    ("UZ", "ru", "seoul", "d2", "student", "IT student"),
    ("UZ", "ko", "incheon", "f4", "office", "Koryo-saram working in logistics"),
    ("NP", "ne", "gyeongnam", "e9", "factory", "factory worker in Gimhae"),
    ("NP", "en", "seoul", "d2", "student", "undergrad on a scholarship"),
    ("NP", "ne", "chungnam", "e9", "farm", "farm worker"),
    ("ID", "id", "gyeongnam", "e9", "factory", "shipyard worker in Geoje"),
    ("ID", "id", "seoul", "d2", "student", "student who looks for halal food"),
    ("ID", "en", "busan", "e9", "factory", "fishing-port worker"),
    ("PH", "fil", "gyeonggi", "e9", "factory", "electronics factory worker"),
    ("PH", "en", "seoul", "f6", "parent", "married, tutors English part-time"),
    ("PH", "en", "jeju", "etc", "service", "resort staff on Jeju"),
    ("MN", "mn", "seoul", "d2", "student", "nursing student"),
    ("MN", "mn", "incheon", "e9", "factory", "factory worker"),
    ("MN", "ko", "seoul", "f5", "service", "runs a small Mongolian restaurant near Dongdaemun"),
    ("KH", "km", "gyeonggi", "e9", "farm", "agricultural worker"),
    ("KH", "km", "chungbuk", "f6", "parent", "married, learning Korean at a multicultural center"),
    ("KZ", "ru", "seoul", "d2", "student", "business student"),
    ("KZ", "kk", "gyeonggi", "h2", "factory", "Koryo-saram on an H-2 visa"),
    ("RU", "ru", "seoul", "e7", "office", "UX designer"),
    ("RU", "ko", "busan", "f6", "parent", "married, translator"),
    ("JP", "ja", "seoul", "d4", "student", "Korean-language student on a gap year"),
    ("JP", "ko", "seoul", "e7", "office", "office worker at a Japanese company's Seoul branch"),
    ("JP", "ja", "daejeon", "d2", "student", "researcher at a university lab"),
    ("IN", "en", "gyeonggi", "e7", "office", "software engineer in Pangyo"),
    ("IN", "hi", "daejeon", "d2", "student", "PhD student"),
    ("FR", "fr", "seoul", "d2", "student", "exchange student"),
    ("FR", "en", "seoul", "e7", "service", "pastry chef at a bakery"),
    ("CA", "en", "busan", "etc", "office", "English teacher"),
]

WEEK = (
    "The simulated week is mid-November in Korea: the first real cold snap, people buying padded coats and electric "
    "blankets, kimjang season, the last autumn leaves, Pepero Day on 11/11, the university entrance exam (suneung) "
    "coming up, heating and gas bills going up, flu shots, Christmas pop-ups opening in Seongsu, year-end parties starting."
)


def llm():
    from openai import OpenAI

    return OpenAI(api_key=os.environ["NIM_KEY"], base_url=BASE_URL)


def ask_json(client, prompt, tries=4):
    """One chat call that must return a JSON object."""
    for i in range(tries):
        try:
            r = client.chat.completions.create(
                model=MODEL, temperature=0.9, max_tokens=12000, timeout=240,
                response_format={"type": "json_object"},
                messages=[{"role": "system", "content": "Reply with one JSON object only."}, {"role": "user", "content": prompt}],
            )
            text = r.choices[0].message.content or ""
            return json.loads(text[text.index("{"): text.rindex("}") + 1])
        except Exception as e:  # rate limits and the odd malformed reply: back off and retry
            print(f"  retry {i + 1}: {str(e)[:120]}", file=sys.stderr)
            time.sleep(5 * (i + 1))
    raise RuntimeError("LLM gave no usable JSON")


# ---------------------------------------------------------------- personas
def personas():
    client = llm()
    # Resumable: members already written are kept, so a stopped run picks up where it left off.
    out = json.loads(PERSONAS.read_text()) if PERSONAS.exists() else []
    for i, (code, writes, region, visa, life, who) in enumerate(CAST):
        if i < len(out):
            continue
        p = ask_json(client, f"""Invent one fictional member of "Boundless", an anonymous online community for foreigners living in Korea.
Fixed facts: nationality {code}; {who}; lives in region "{region}"; visa "{visa}"; writes posts in {LANG_NAME[writes]}.
{WEEK}
Return JSON with:
 "name": a plausible first name only (fictional),
 "age": integer, "gender": "male"|"female",
 "mbti": 4 letters,
 "profession": short,
 "years_in_korea": number,
 "korean_level": "beginner"|"intermediate"|"fluent",
 "bio": one line under 140 characters, in English,
 "persona": 6-9 sentences in English: background, personality, writing style (tone, typical length, emoji or not,
   slang), what they are good at helping others with, what worries or excites them this particular week,
   and that they always write in {LANG_NAME[writes]},
 "topics": 2-4 of {list(BOARDS)} they care about most,
 "activity": a number 0.3-0.9 for how often they open the app,
 "opening_post": {{"board": one of the topics, "title": under 60 characters, "body": 2-6 sentences}}, written in
   {LANG_NAME[writes]} in their own voice about something real in their week. No names of real people,
   no phone numbers, no messenger IDs, no links.""")
        p.update({"id": i, "code": code, "lang": writes, "region": region, "visa": visa, "life": life, "who": who})
        out.append(p)
        PERSONAS.write_text(json.dumps(out, ensure_ascii=False, indent=1))
        print(f"{i:02d} {code} {p.get('name')} - {p.get('opening_post', {}).get('title')}", flush=True)


# ---------------------------------------------------------------- build
def build():
    cast = json.loads(PERSONAS.read_text())
    SIM.mkdir(exist_ok=True)
    profiles = []
    for p in cast:
        persona = (
            f"{p['persona']}\n\nYou are on Boundless, an anonymous community where foreigners living in Korea ask and help each other. "
            f"You are from {p['code']} ({p['who']}), living in {p['region']}. Write every post and comment in {LANG_NAME[p['lang']]}. "
            "A post's first line is a short title (under 60 characters), then a blank line, then the body. "
            "Comments answer the post concretely, from your own experience in Korea, in 1-4 sentences. "
            "Like posts and comments that actually help. Never share real names, phone numbers, messenger IDs or links. "
            + WEEK
        )
        profiles.append({
            "user_id": p["id"], "username": f"{p['code'].lower()}_{p['id']:02d}", "name": p["name"], "bio": p["bio"][:150],
            "persona": persona, "karma": random.randint(200, 3000), "created_at": "2026-10-01",
            "age": p.get("age", 30), "gender": p.get("gender", "other"), "mbti": p.get("mbti", "ISFJ"),
            "country": p["code"], "profession": p.get("profession", ""), "interested_topics": p.get("topics", []),
        })
    (SIM / "reddit_profiles.json").write_text(json.dumps(profiles, ensure_ascii=False, indent=1))

    # Kick off with a dozen opening posts spread over boards; the rest grow out of the simulation.
    rng = random.Random(7)
    seen, initial = set(), []
    for p in rng.sample(cast, len(cast)):
        op = p.get("opening_post") or {}
        if op.get("board") in seen or len(initial) >= 12:
            continue
        seen.add(op.get("board"))
        initial.append({"poster_agent_id": p["id"], "content": f"{op['title']}\n\n{op['body']}"})
    config = {
        "simulation_id": "boundless-week",
        "time_config": {
            "total_simulation_hours": DAYS * 24, "minutes_per_round": MINUTES_PER_ROUND,
            "agents_per_hour_min": 3, "agents_per_hour_max": 6,
            "peak_hours": [12, 21, 22, 23], "off_peak_hours": [2, 3, 4, 5],
            "peak_activity_multiplier": 1.4, "off_peak_activity_multiplier": 0.2,
        },
        "agent_configs": [{"agent_id": p["id"], "active_hours": HOURS[p["life"]], "activity_level": float(p.get("activity", 0.5))} for p in cast],
        "event_config": {"initial_posts": initial},
    }
    (SIM / "simulation_config.json").write_text(json.dumps(config, ensure_ascii=False, indent=1))
    print(f"{len(profiles)} profiles, {len(initial)} opening posts -> {SIM}")


# ---------------------------------------------------------------- run
def run(max_rounds=None):
    mirofish = Path(os.environ["MIROFISH_DIR"]) / "backend" / "scripts"
    sys.path.insert(0, str(mirofish))
    os.environ.update({"LLM_API_KEY": os.environ["NIM_KEY"], "LLM_BASE_URL": BASE_URL, "LLM_MODEL_NAME": MODEL})
    import run_reddit_simulation as R  # MiroFish's runner, used as is

    db = SIM / "reddit_simulation.db"
    marks = []  # (round, max post id, max comment id, max like id, max comment-like id, max follow id) at each round start

    def snapshot(round_num):
        row = [round_num]
        if db.exists():
            con = sqlite3.connect(db)
            for table, key in (("post", "post_id"), ("comment", "comment_id"), ("like", "like_id"), ("comment_like", "comment_like_id"), ("follow", "follow_id")):
                row.append(con.execute(f'SELECT COALESCE(MAX({key}), 0) FROM "{table}"').fetchone()[0])
            con.close()
        else:
            row += [0] * 5
        marks.append(row)
        (SIM / "rounds.json").write_text(json.dumps(marks))

    pick = R.RedditSimulationRunner._get_active_agents_for_round

    def tracked(self, env, hour, round_num):
        snapshot(round_num)
        return pick(self, env, hour, round_num)

    R.RedditSimulationRunner._get_active_agents_for_round = tracked
    R.setup_oasis_logging(str(SIM / "log"))
    R._shutdown_event = asyncio.Event()
    asyncio.run(R.RedditSimulationRunner(str(SIM / "simulation_config.json"), wait_for_commands=False).run(max_rounds=max_rounds))
    snapshot(len(marks) and marks[-1][0] + 1)


# ---------------------------------------------------------------- export
def q(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"


# A few values from src/lib/avatar.ts and animals.ts; parseLook refuses anything else when the page reads it.
SHORT = ["shortFlat", "shortRound", "shortWaved", "shortCurly", "theCaesar", "sides", "frizzle", "shaggy", "fro", "dreads01"]
LONG = ["bob", "bun", "curly", "curvy", "straight01", "straight02", "longButNotTooLong", "bigHair", "miaWallace", "frida"]


def look(p, rng):
    """A cartoon avatar for a simulated member: one in five picks an animal, like real members often do."""
    if rng.random() < 0.2:
        return {"kind": "animal", "animal": rng.choice("cat dog fox bear panda rabbit tiger koala owl penguin".split()),
                "backdrop": rng.choice(["fde2e4", "ffe4cc", "fff1c1", "dff5e1", "e0f2f1", "dbeafe", "ede9fe"])}
    female = str(p.get("gender", "")).lower().startswith("f")
    return {
        "kind": "person",
        "skin": rng.choice(["fde7d6", "f9d4b8", "f1c19b", "e2a77e", "d08b5b", "b8763f", "a0633a", "8a5133", "6b3f2a"]),
        "top": rng.choice(["winterHat02", "winterHat04", "hat"] if rng.random() < 0.15 else LONG if female else SHORT),
        "hair": rng.choice(["1a1414", "3b2a24", "6a4630", "8b4a2b", "b58143", "e2c27c"]),
        "cover": rng.choice(["25557c", "ff5c5c", "d9a441", "3c4f5c"]),
        "glasses": rng.choice(["none"] * 4 + ["prescription01", "round", "kurt"]),
        "beard": "none" if female or rng.random() < 0.7 else rng.choice(["beardLight", "beardMedium", "moustacheFancy"]),
        "clothes": rng.choice(["262e33", "3c4f5c", "25557c", "5199e4", "6b7f3a", "d9a441", "ffafb9", "ff5c5c", "8c2f39", "e6e6e6"]),
        "outfit": rng.choice(["shirtCrewNeck", "shirtVNeck", "hoodie", "collarAndSweater", "blazerAndSweater", "overall"]),
        "face": rng.choice(["smile", "happy", "wink", "calm"]),
    }


def export():
    cast = {p["id"]: p for p in json.loads(PERSONAS.read_text())}
    marks = json.loads((SIM / "rounds.json").read_text())
    con = sqlite3.connect(SIM / "reddit_simulation.db")
    con.row_factory = sqlite3.Row
    rng = random.Random(11)
    total = DAYS * 24 * 60

    def minute(col, row_id):
        """Simulated minute (0 = a week ago) of a row, from the round it was written in, plus jitter inside that round."""
        r = 0
        for m in marks:
            if m[col] < row_id:
                r = m[0]
        return min(total - 5, r * MINUTES_PER_ROUND + rng.randint(0, MINUTES_PER_ROUND - 1))

    posts = [dict(x) for x in con.execute("SELECT post_id, user_id, content FROM post WHERE original_post_id IS NULL AND content <> '' ORDER BY post_id")]
    comments = [dict(x) for x in con.execute("SELECT comment_id, post_id, user_id, content FROM comment WHERE content <> '' ORDER BY comment_id")]
    likes = [dict(x) for x in con.execute('SELECT like_id, user_id, post_id FROM "like"')]
    clikes = [dict(x) for x in con.execute("SELECT comment_like_id, user_id, comment_id FROM comment_like")]
    follows = [dict(x) for x in con.execute("SELECT follower_id, followee_id FROM follow WHERE follower_id <> followee_id")]

    # Label posts in batches: board, 말머리, a clean title and body, the language, market and event fields.
    client = llm()
    labels = {}
    for i in range(0, len(posts), 8):
        batch = posts[i: i + 8]
        res = ask_json(client, f"""Label these posts from a community of foreigners living in Korea. Boards and their tags: {json.dumps(BOARDS)}.
For each post return an item in "items": {{"id", "board", "tag" (must belong to the board), "title" (the post's own first line,
cleaned, under 60 chars, same language), "body" (the rest, unchanged; if empty, write one sentence in the same language),
"lang" (one of {list(LANG_NAME)}), "price" (KRW integer for market sell/buy, 0 for free giveaways, else null),
"place" (neighborhood for market or event posts, else null), "event_days" ([start, end] day offsets from today for
pop-up info posts, e.g. [-2, 10], else null)}}.
Posts: {json.dumps([{"id": p["post_id"], "text": p["content"][:1500]} for p in batch], ensure_ascii=False)}""")
        for it in res.get("items", []):
            labels[it.get("id")] = it
        print(f"labelled {min(i + 8, len(posts))}/{len(posts)}")

    uid = lambda a: f"00000000-0000-4000-9000-{a + 1:012d}"
    lines = [
        "-- FICTIONAL community activity generated by scripts/community/community.py (MiroFish / OASIS simulation).",
        "-- Never real people. Run after db/seed.sql (seed.sql deletes every @example.com account).",
        "DELETE FROM boundless.users WHERE email LIKE 'sim-%@example.com';",
        "",
    ]
    for a, p in cast.items():
        lines.append(
            f"INSERT INTO boundless.users (id, email, nationality, region, avatar, avatar_public, created_at) VALUES ({q(uid(a))}, {q(f'sim-{a:02d}@example.com')}, "
            f"{q(p['code'])}, {q(p['region'])}, {q(json.dumps(look(p, rng)))}, true, now() - interval '{rng.randint(10, 90)} days');"
        )

    age = lambda m: f"now() - interval '{total - m} minutes'"
    post_min, post_author, kept = {}, {}, set()
    for p in posts:
        lab = labels.get(p["post_id"]) or {}
        board = lab.get("board") if lab.get("board") in BOARDS else "chat"
        tag = lab.get("tag") if lab.get("tag") in BOARDS[board] else BOARDS[board][0]
        first, _, rest = p["content"].strip().partition("\n")
        title = (lab.get("title") or first or "…").strip()[:60]
        body = (lab.get("body") or rest or first).strip()[:5000]
        if len(title) < 2 or len(body) < 2:
            continue
        author = cast[p["user_id"]]
        lang = lab.get("lang") if lab.get("lang") in LANG_NAME else author["lang"]
        m = minute(1, p["post_id"])
        price = lab.get("price") if board == "market" and isinstance(lab.get("price"), int) else None
        if board == "market" and tag == "free":
            price = 0
        days = lab.get("event_days") if board == "popup" and tag == "info" else None
        starts = ends = "NULL"
        if isinstance(days, list) and len(days) == 2:
            starts, ends = f"current_date + {int(days[0])}", f"current_date + {int(days[1])}"
        deal = "NULL" if price is None else q(rng.choice(["open", "open", "open", "reserved", "done"]))
        lines.append(
            "INSERT INTO boundless.posts (id, user_id, space, topic, kind, lang, region, visa, title, body, price, deal, place, starts_on, ends_on, created_at) "
            f"VALUES ({900000 + p['post_id']}, {q(uid(p['user_id']))}, 'global', {q(board)}, {q(tag)}, {q(lang)}, {q(author['region'])}, {q(author['visa'])}, "
            f"{q(title)}, {q(body)}, {price if price is not None else 'NULL'}, {deal}, {q((lab.get('place') or None) and str(lab['place'])[:80])}, {starts}, {ends}, {age(m)});"
        )
        post_min[p["post_id"]], post_author[p["post_id"]] = m, p["user_id"]
        kept.add(p["post_id"])

    anon, comment_post, comment_min = {}, {}, {}
    for c in comments:
        if c["post_id"] not in kept:
            continue
        m = max(minute(2, c["comment_id"]), post_min[c["post_id"]] + rng.randint(3, 90))
        if m >= total:
            continue
        handles = anon.setdefault(c["post_id"], {post_author[c["post_id"]]: 0})
        no = handles.setdefault(c["user_id"], len(handles))
        lines.append(
            f"INSERT INTO boundless.comments (id, post_id, user_id, anon_no, body, created_at) VALUES "
            f"({900000 + c['comment_id']}, {900000 + c['post_id']}, {q(uid(c['user_id']))}, {no}, {q(c['content'].strip()[:2000])}, {age(m)});"
        )
        comment_post[c["comment_id"]], comment_min[c["comment_id"]] = c["post_id"], m

    for l in likes:
        if l["post_id"] in kept and l["user_id"] != post_author[l["post_id"]]:
            lines.append(f"INSERT INTO boundless.post_likes (user_id, post_id, created_at) VALUES ({q(uid(l['user_id']))}, {900000 + l['post_id']}, {age(max(minute(3, l['like_id']), post_min[l['post_id']] + 5))}) ON CONFLICT DO NOTHING;")
    clike_count = {}
    for l in clikes:
        if l["comment_id"] in comment_post:
            clike_count[l["comment_id"]] = clike_count.get(l["comment_id"], 0) + 1
            lines.append(f"INSERT INTO boundless.comment_likes (user_id, comment_id) VALUES ({q(uid(l['user_id']))}, {900000 + l['comment_id']}) ON CONFLICT DO NOTHING;")
    for f in follows:
        lines.append(f"INSERT INTO boundless.follows (user_id, followee_id) VALUES ({q(uid(f['follower_id']))}, {q(uid(f['followee_id']))}) ON CONFLICT DO NOTHING;")

    # Questions whose author found a helpful answer: accept the most-liked neighbor comment about half the time.
    asks = {"question", "worry", "advice"}
    by_post, comment_user = {}, {c["comment_id"]: c["user_id"] for c in comments}
    for cid, pid in comment_post.items():
        by_post.setdefault(pid, []).append(cid)
    for pid, cids in by_post.items():
        lab = labels.get(pid) or {}
        others = [c for c in cids if comment_user[c] != post_author[pid]]
        if lab.get("tag") in asks and others and rng.random() < 0.55:
            best = max(others, key=lambda c: (clike_count.get(c, 0), -comment_min[c]))
            lines.append(f"UPDATE boundless.posts SET solved = true, accepted_comment_id = {900000 + best} WHERE id = {900000 + pid};")
    for pid in kept:
        n = len(by_post.get(pid, []))
        lines.append(f"UPDATE boundless.posts SET views = {rng.randint(8, 40) + n * rng.randint(6, 15)} WHERE id = {900000 + pid};")
    OUT_SQL.write_text("\n".join(lines) + "\n")
    print(f"{len(kept)} posts, {len(comment_post)} comments, {len(likes)} likes, {len(follows)} follows -> {OUT_SQL}")


if __name__ == "__main__":
    step = sys.argv[1] if len(sys.argv) > 1 else ""
    if step == "personas":
        personas()
    elif step == "build":
        build()
    elif step == "run":
        run(int(sys.argv[2]) if len(sys.argv) > 2 else None)
    elif step == "export":
        export()
    else:
        print(__doc__)
