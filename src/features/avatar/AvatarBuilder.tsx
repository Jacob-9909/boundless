"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { removeAvatar, saveAvatar } from "@/app/actions";
import {
  ANIMALS,
  BACKDROPS,
  BEARDS,
  BROWS,
  COLORS,
  COVERS,
  DEFAULT_ANIMAL,
  DEFAULT_PERSON,
  EYES,
  FACES,
  GLASSES,
  HAIRS,
  lookStyle,
  MOUTHS,
  nearest,
  OUTFITS,
  SKINS,
  TOPS,
  type Animal,
  type Look,
  type Person,
} from "@/features/avatar/avatar";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Slider } from "@astryxdesign/core/Slider";
import { Icon, type IconName } from "../../components/Icon";
import { useT } from "../i18n/I18nProvider";

const legend = "mb-1.5 block text-sm font-bold";
// ponytail: swatches and parts stay plain aria-pressed buttons. Astryx has no swatch picker, ToggleButton's icon
// slot is too small for a 52px avatar preview, and SelectableCard is a checkbox (e2e presses them as buttons).
const pressed = "outline-3 outline-offset-2 outline-[var(--c-primary)]";

type Tab = "skin" | "hair" | "face" | "eyes" | "brows" | "mouth" | "beard" | "glasses" | "outfit" | "backdrop";
type State = { kind: Look["kind"]; person: Person; animal: Animal };
const pick = <V,>(list: V[]) => list[Math.floor(Math.random() * list.length)];
// Close-ups for the face-part thumbnails, so the difference between two pairs of eyes is visible at 56px.
const ZOOM: Partial<Record<Tab, { backgroundSize: string; backgroundPosition: string }>> = {
  eyes: { backgroundSize: "240%", backgroundPosition: "50% 33%" },
  brows: { backgroundSize: "240%", backgroundPosition: "50% 27%" },
  mouth: { backgroundSize: "240%", backgroundPosition: "50% 50%" },
  glasses: { backgroundSize: "200%", backgroundPosition: "50% 33%" },
  beard: { backgroundSize: "170%", backgroundPosition: "50% 50%" },
};

/**
 * A character creator in the spirit of game ones: a lit stage with the avatar, quick actions (random, undo, flip,
 * start over), then one category at a time with picture choices and colors, including a free color picker.
 */
export function AvatarBuilder({ initial, shown, soft, doneHref }: { initial: Look | null; shown: boolean; soft: string; doneHref?: string }) {
  const t = useT();
  const router = useRouter();
  const first: State = {
    kind: initial?.kind ?? "person",
    person: initial?.kind === "person" ? initial : DEFAULT_PERSON,
    animal: initial?.kind === "animal" ? initial : DEFAULT_ANIMAL,
  };
  const [state, setState] = useState<State>(first);
  const [history, setHistory] = useState<State[]>([]);
  const [tab, setTab] = useState<Tab>("skin");
  const [show, setShow] = useState(shown);
  const [saved, setSaved] = useState("");
  const [pending, start] = useTransition();
  const { kind, person, animal } = state;
  const look: Look = kind === "person" ? person : animal;
  // Every change goes through here, so 되돌리기 can step back (the last 30 changes).
  const commit = (next: State) => {
    setHistory((h) => [...h.slice(-29), state]);
    setState(next);
    setSaved("");
  };
  const setP = (patch: Partial<Person>) => commit({ ...state, person: { ...person, ...patch } });
  const setA = (patch: Partial<Animal>) => commit({ ...state, animal: { ...animal, ...patch } });
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setState(prev);
    setSaved("");
  };
  const random = () =>
    kind === "animal"
      ? setA({ animal: pick(ANIMALS), backdrop: pick(BACKDROPS) })
      : setP({
          skin: pick(SKINS),
          top: pick(TOPS),
          hair: pick(HAIRS),
          cover: pick(COLORS),
          glasses: Math.random() < 0.7 ? "none" : pick(GLASSES),
          beard: Math.random() < 0.7 ? "none" : pick(BEARDS),
          clothes: pick(COLORS),
          outfit: pick(OUTFITS),
          eyes: pick(EYES),
          brows: pick(BROWS),
          mouth: pick(MOUTHS.slice(0, 6)),
          beardColor: undefined,
          glassesColor: undefined,
        });
  const reset = () => commit({ ...state, person: DEFAULT_PERSON, animal: DEFAULT_ANIMAL });
  const save = () =>
    start(async () => {
      const r = await saveAvatar(look, show);
      setSaved(r.error ? t(r.error) : t("저장했어요"));
      // Sign-up's first step: once saved, carry on to where the person was going.
      if (!r.error && doneHref) router.push(doneHref);
    });
  const ANIMAL_NAMES: Record<string, string> = {
    cat: t("고양이"),
    dog: t("강아지"),
    fox: t("여우"),
    bear: t("곰"),
    panda: t("판다"),
    rabbit: t("토끼"),
    tiger: t("호랑이"),
    koala: t("코알라"),
    owl: t("부엉이"),
    penguin: t("펭귄"),
    monkey: t("원숭이"),
    lion: t("사자"),
  };
  const TABS: [Tab, string][] = [
    ["skin", t("피부")],
    ["hair", t("헤어")],
    ["face", t("표정")],
    ["eyes", t("눈")],
    ["brows", t("눈썹")],
    ["mouth", t("입")],
    ["beard", t("수염")],
    ["glasses", t("안경")],
    ["outfit", t("의상")],
    ["backdrop", t("배경")],
  ];
  const face = FACES[person.face] ?? FACES.smile;
  const parts = (label: string, field: keyof Person, list: string[], value: string, onPick: (v: string) => void, names?: Record<string, string>) => (
    <Parts label={label} list={list} value={value} soft={soft} preview={(v) => ({ ...person, [field]: v })} zoom={ZOOM[tab]} onPick={onPick} names={names} />
  );

  return (
    <div className="grid gap-6 px-4 py-4 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Phones: the left column dissolves into the grid so the stage can stay pinned under the top bar while the
          choices scroll below it, small enough to leave room for them. */}
      <div className="space-y-4 max-md:contents md:sticky md:top-20 md:self-start">
        {/* The stage: the avatar under a soft spotlight in the member's culture color, like a game's character screen. */}
        <div
          className="relative overflow-hidden rounded-3xl px-4 pt-6 pb-4 text-center text-white max-md:sticky max-md:top-[4.25rem] max-md:z-20 max-md:flex max-md:items-center max-md:gap-3 max-md:p-3 max-md:text-left max-md:shadow-lg"
          style={{ background: "radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--c-primary) 30%, white) 0%, var(--c-primary) 48%, #0b1224 100%)" }}
        >
          <div
            className="size-24 shrink-0 rounded-full shadow-[0_18px_40px_rgb(0_0_0/.35)] ring-4 ring-white/70 md:mx-auto md:size-52 lg:size-60"
            style={lookStyle(look, soft)}
            role="img"
            aria-label={t("내 아바타 미리 보기")}
          />
          <div className="mx-auto mt-3 h-3 w-36 rounded-[50%] bg-black/30 blur-[3px] max-md:hidden" aria-hidden="true" />
          <div className="flex flex-wrap gap-2 md:mt-4 md:justify-center">
            <StageButton icon="sparkles" label={t("랜덤")} onClick={random} />
            <StageButton icon="reply" label={t("되돌리기")} onClick={undo} disabled={!history.length} />
            {kind === "person" && <StageButton icon="lift" label={t("좌우 반전")} onClick={() => setP({ flip: !person.flip })} />}
            <StageButton icon="back" label={t("처음으로")} onClick={reset} />
          </div>
        </div>
        {kind === "person" && <PhotoMatch onColors={(skin, hair) => setP({ skin, hair })} />}
      </div>

      <div className="min-w-0 space-y-5">
        <SegmentedControl label={t("아바타 종류")} size="lg" value={kind} onChange={(k) => commit({ ...state, kind: k as Look["kind"] })}>
          <SegmentedControlItem value="person" label={t("사람")} />
          <SegmentedControlItem value="animal" label={t("동물")} />
        </SegmentedControl>

        {kind === "person" ? (
          <>
            <div role="tablist" aria-label={t("아바타 꾸미기 메뉴")} className="flex flex-wrap gap-1.5">
              {TABS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="avatar-panel"
                  onClick={() => setTab(id)}
                  className={`h-9 rounded-full px-3.5 text-sm font-bold transition ${tab === id ? "bg-primary text-paper" : "bg-[var(--color-background-muted)] hover:bg-primary/10"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div role="tabpanel" id="avatar-panel" aria-labelledby={`tab-${tab}`} className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-card)] p-4">
              {tab === "skin" && <Swatches label={t("피부색")} list={SKINS} value={person.skin} onPick={(skin) => setP({ skin })} />}
              {tab === "hair" && (
                <>
                  {parts(t("머리 모양"), "top", TOPS, person.top, (top) => setP({ top }), { hijab: t("히잡"), turban: t("터번"), hat: t("모자"), winterHat1: t("털모자") })}
                  {COVERS.includes(person.top) ? (
                    <Swatches label={t("히잡·모자 색")} list={COLORS} value={person.cover} onPick={(cover) => setP({ cover })} />
                  ) : (
                    <Swatches label={t("머리색")} list={HAIRS} value={person.hair} onPick={(hair) => setP({ hair })} />
                  )}
                </>
              )}
              {tab === "face" &&
                parts(t("표정"), "face", Object.keys(FACES), person.face, (f) => setP({ face: f, eyes: undefined, brows: undefined, mouth: undefined }), {
                  smile: t("웃는 얼굴"),
                  happy: t("신난 얼굴"),
                  wink: t("윙크"),
                  calm: t("차분한 얼굴"),
                })}
              {tab === "eyes" && parts(t("눈"), "eyes", EYES, person.eyes ?? face.eyes, (eyes) => setP({ eyes }))}
              {tab === "brows" && parts(t("눈썹"), "brows", BROWS, person.brows ?? face.eyebrows, (brows) => setP({ brows }))}
              {tab === "mouth" && parts(t("입"), "mouth", MOUTHS, person.mouth ?? face.mouth, (mouth) => setP({ mouth }))}
              {tab === "beard" && (
                <>
                  {parts(t("수염"), "beard", BEARDS, person.beard, (beard) => setP({ beard }))}
                  {person.beard !== "none" && <Swatches label={t("수염 색")} list={HAIRS} value={person.beardColor ?? person.hair} onPick={(beardColor) => setP({ beardColor })} />}
                </>
              )}
              {tab === "glasses" && (
                <>
                  {parts(t("안경"), "glasses", GLASSES, person.glasses, (glasses) => setP({ glasses }))}
                  {person.glasses !== "none" && <Swatches label={t("안경 색")} list={COLORS} value={person.glassesColor ?? ""} onPick={(glassesColor) => setP({ glassesColor })} />}
                </>
              )}
              {tab === "outfit" && (
                <>
                  {parts(t("옷 모양"), "outfit", OUTFITS, person.outfit, (outfit) => setP({ outfit }))}
                  <Swatches label={t("옷 색")} list={COLORS} value={person.clothes} onPick={(clothes) => setP({ clothes })} />
                </>
              )}
              {tab === "backdrop" && (
                <Swatches
                  label={t("배경색")}
                  list={BACKDROPS}
                  value={person.backdrop ?? ""}
                  onPick={(backdrop) => setP({ backdrop })}
                  lead={
                    <button
                      type="button"
                      aria-pressed={!person.backdrop}
                      onClick={() => setP({ backdrop: undefined })}
                      className={`h-10 rounded-full px-3 text-xs font-bold ring-1 ring-black/15 ${!person.backdrop ? pressed : ""}`}
                      style={{ backgroundColor: soft }}
                    >
                      {t("기본 배경")}
                    </button>
                  }
                />
              )}
            </div>
          </>
        ) : (
          <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-card)] p-4">
            <Parts
              label={t("동물")}
              list={ANIMALS}
              value={animal.animal}
              soft={soft}
              preview={(v) => ({ ...animal, animal: v })}
              onPick={(a) => setA({ animal: a })}
              names={ANIMAL_NAMES}
            />
            <Swatches label={t("배경색")} list={BACKDROPS} value={animal.backdrop} onPick={(backdrop) => setA({ backdrop })} />
          </div>
        )}

        <Card className="border-l-4 border-l-primary">
          <CheckboxInput
            label={t("내 글과 댓글에도 이 아바타 쓰기")}
            description={t("켜면 같은 아바타가 붙어서 내 글끼리 이어 볼 수 있어요. 끄면 지금처럼 국기 아바타가 보여요.")}
            value={show}
            onChange={(v) => (setShow(v), setSaved(""))}
          />
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button label={t("저장")} variant="primary" size="lg" onClick={save} isLoading={pending} />
          {initial && (
            <form action={removeAvatar}>
              <Button type="submit" label={t("아바타 지우기")} variant="secondary" size="lg" />
            </form>
          )}
          <span role="status" className="text-sm font-bold">
            {saved}
          </span>
        </div>
        <p className="text-xs opacity-60">{t("캐릭터 디자인")}: Avataaars (Pablo Stanley) · DiceBear · Boundless</p>
      </div>
    </div>
  );
}

function StageButton({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-xs font-bold text-white ring-1 ring-white/35 backdrop-blur transition hover:bg-white/25 disabled:opacity-40 md:h-9 md:px-3 md:text-sm"
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}

/** Palette swatches plus a free color picker (the native one); a color off the palette shows on the picker. */
function Swatches({ label, list, value, onPick, lead }: { label: string; list: string[]; value: string; onPick: (v: string) => void; lead?: ReactNode }) {
  const t = useT();
  const custom = !!value && !list.includes(value);
  return (
    <fieldset>
      <legend className={legend}>{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {lead}
        {list.map((hex, i) => (
          <button
            key={hex}
            type="button"
            aria-label={t("색 {n}", { n: i + 1 })}
            aria-pressed={value === hex}
            onClick={() => onPick(hex)}
            className={`size-10 rounded-full ring-1 ring-black/15 transition ${value === hex ? pressed : ""}`}
            style={{ backgroundColor: `#${hex}` }}
          />
        ))}
        <label
          title={t("직접 고르기")}
          className={`relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full ring-1 ring-black/15 ${custom ? pressed : ""}`}
          style={{ background: custom ? `#${value}` : "conic-gradient(#f44, #fd4, #4d6, #4cf, #64f, #f4c, #f44)" }}
        >
          {!custom && <Icon name="plus" size={16} className="text-white drop-shadow" />}
          <input
            type="color"
            aria-label={t("직접 고르기")}
            value={`#${value || "888888"}`}
            onChange={(e) => onPick(e.target.value.slice(1).toLowerCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </fieldset>
  );
}

function Parts({
  label,
  list,
  value,
  soft,
  preview,
  zoom,
  onPick,
  names = {},
}: {
  label: string;
  list: string[];
  value: string;
  soft: string;
  preview: (v: string) => Look;
  zoom?: { backgroundSize: string; backgroundPosition: string };
  onPick: (v: string) => void;
  names?: Record<string, string>; // parts worth naming for screen readers (head coverings, faces, animals)
}) {
  const t = useT();
  return (
    <fieldset>
      <legend className={legend}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {list.map((v, i) => (
          <button
            key={v}
            type="button"
            aria-label={names[v] ?? (v === "none" ? t("없음") : t("모양 {n}", { n: i + 1 }))}
            aria-pressed={value === v}
            onClick={() => onPick(v)}
            className={`rounded-2xl ring-1 ring-black/10 transition ${value === v ? pressed : "hover:ring-black/30"}`}
            style={{ ...lookStyle(preview(v), soft), ...zoom, width: 56, height: 56 }}
          />
        ))}
      </div>
    </fieldset>
  );
}

const BOX = 260;
// Where the face goes inside the guide (fractions of the box) and where colors are read.
const SKIN_AT = [
  [0.38, 0.6],
  [0.62, 0.6],
  [0.5, 0.36],
];
const HAIR_AT = [
  [0.5, 0.07],
  [0.32, 0.13],
  [0.68, 0.13],
];

/**
 * Reads skin and hair colors from a photo. The photo stays on the device: it is drawn on a canvas here, sampled,
 * and dropped. ponytail: the person lines the face up with the oval by hand; automatic face finding needs an
 * 18 MB model download.
 */
function PhotoMatch({ onColors }: { onColors: (skin: string, hair: string) => void }) {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [nat, setNat] = useState({ w: 1, h: 1 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const img = useRef<HTMLImageElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const scale = Math.max(BOX / nat.w, BOX / nat.h) * zoom;
  const left = (BOX - nat.w * scale) / 2 + pos.x;
  const top = (BOX - nat.h * scale) / 2 + pos.y;

  const close = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
  };
  const read = () => {
    const el = img.current;
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!el || !ctx) return;
    ctx.canvas.width = ctx.canvas.height = BOX;
    ctx.drawImage(el, left, top, nat.w * scale, nat.h * scale);
    const avg = (pts: number[][]) => {
      const sums = pts.map(([fx, fy]) => {
        const d = ctx.getImageData(Math.round(fx * BOX) - 6, Math.round(fy * BOX) - 6, 12, 12).data;
        const s = [0, 0, 0];
        for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) s[c] += d[i + c];
        return s.map((v) => v / (d.length / 4));
      });
      // Median per channel across the patches, so one patch on an eye or a shadow does not pull the color.
      return [0, 1, 2].map((c) => sums.map((s) => s[c]).sort((a, b) => a - b)[Math.floor(sums.length / 2)]);
    };
    onColors(nearest(avg(SKIN_AT), SKINS), nearest(avg(HAIR_AT), HAIRS));
    close();
  };

  if (!url)
    return (
      <div className="mt-4 text-center">
        <Button label={t("사진으로 색 채우기")} variant="secondary" icon={<Icon name="image" size={16} />} onClick={() => file.current?.click()} />
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setError("");
            setZoom(1);
            setPos({ x: 0, y: 0 });
            setUrl(URL.createObjectURL(f));
          }}
        />
        <p className="mt-2 text-xs opacity-70">{t("사진은 이 기기에서만 쓰고, 저장하거나 서버로 보내지 않아요.")}</p>
        {error && <p className="mt-2 text-sm font-bold text-[var(--color-text-error)]">{error}</p>}
      </div>
    );

  return (
    <div className="mt-4 space-y-3 text-center">
      <p className="text-sm font-bold">{t("얼굴을 원 안에 맞춘 뒤 색을 읽어요")}</p>
      <div
        className="relative mx-auto touch-none overflow-hidden rounded-2xl bg-ink/10 select-none"
        style={{ width: BOX, height: BOX }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setPos({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL, drawn on a canvas and dropped */}
        <img
          ref={img}
          src={url}
          alt=""
          draggable={false}
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          onError={() => {
            close();
            setError(t("이 사진은 열 수 없어요. 다른 사진을 골라 주세요."));
          }}
          className="pointer-events-none absolute max-w-none"
          style={{ left, top, width: nat.w * scale, height: nat.h * scale }}
        />
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <path d="M0 0h100v100H0z M50 10a30 38 0 1 0 0.01 0z" fill="rgba(0,0,0,.45)" fillRule="evenodd" />
          <ellipse cx="50" cy="48" rx="30" ry="38" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="3 2" />
        </svg>
      </div>
      <div className="mx-auto max-w-[260px] text-left">
        <Slider label={t("크기")} min={1} max={3} step={0.05} value={zoom} onChange={setZoom} valueDisplay="none" width="100%" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button label={t("이 위치로 색 읽기")} variant="primary" onClick={read} />
        <Button label={t("취소")} variant="secondary" onClick={close} />
      </div>
    </div>
  );
}
