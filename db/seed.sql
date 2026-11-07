-- FICTIONAL demo data for local development and demos. Never run against production.
-- All accounts use @example.com and are re-created on every run.
DELETE FROM boundless.users WHERE email LIKE '%@example.com' AND email <> 'admin@example.com';

INSERT INTO boundless.users (id, email, nationality, created_at) VALUES
  ('00000000-0000-4000-8000-000000000001', 'fr@example.com', 'FR', now() - interval '20 days'),
  ('00000000-0000-4000-8000-000000000002', 'vn@example.com', 'VN', now() - interval '18 days'),
  ('00000000-0000-4000-8000-000000000003', 'us@example.com', 'US', now() - interval '17 days'),
  ('00000000-0000-4000-8000-000000000004', 'cn@example.com', 'CN', now() - interval '15 days'),
  ('00000000-0000-4000-8000-000000000005', 'np@example.com', 'NP', now() - interval '14 days'),
  ('00000000-0000-4000-8000-000000000006', 'th@example.com', 'TH', now() - interval '12 days'),
  ('00000000-0000-4000-8000-000000000007', 'uz@example.com', 'UZ', now() - interval '11 days'),
  ('00000000-0000-4000-8000-000000000008', 'ph@example.com', 'PH', now() - interval '10 days'),
  ('00000000-0000-4000-8000-000000000009', 'mn@example.com', 'MN', now() - interval '9 days'),
  ('00000000-0000-4000-8000-000000000010', 'id@example.com', 'ID', now() - interval '8 days'),
  ('00000000-0000-4000-8000-000000000011', 'jp@example.com', 'JP', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000012', 'kz@example.com', 'KZ', now() - interval '6 days'),
  ('00000000-0000-4000-8000-000000000013', 'ca@example.com', 'CA', now() - interval '5 days');

WITH p AS (
  INSERT INTO boundless.posts (user_id, topic, kind, lang, title, body, created_at) VALUES
  ('00000000-0000-4000-8000-000000000002', 'daily', 'question', 'vi',
   'Hỏi lịch bỏ rác tái chế ở khu Mapo',
   E'Mình mới chuyển đến Mapo-gu. Hộp các-tông và chai nhựa thì bỏ vào ngày nào, ở đâu?\nThông báo của tòa nhà chỉ có tiếng Hàn nên mình chưa hiểu.',
   now() - interval '50 minutes'),
  ('00000000-0000-4000-8000-000000000001', 'transit', 'question', 'en',
   'Topping up a transit card in Busan',
   E'I''m in Busan this week. Where can I top up a transit card?\nDo convenience stores accept foreign cards for top-ups?',
   now() - interval '3 hours'),
  ('00000000-0000-4000-8000-000000000003', 'procedures', 'experience', 'en',
   'ARC renewal at the immigration office: what I wish I knew',
   E'Book the visit online well ahead; slots fill up weeks in advance.\nBring your lease contract, passport, and a recent photo. Ask the officer which documents apply to your visa type, mine needed one extra form.',
   now() - interval '9 hours'),
  ('00000000-0000-4000-8000-000000000004', 'health', 'question', 'zh',
   '没有健康保险，看牙医大概多少钱？',
   E'牙疼两天了，我还没有加入国民健康保险。\n有没有人知道普通检查和补牙大概要多少钱？我住在首尔麻浦区附近。',
   now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000005', 'housing', 'question', 'en',
   'Is this deposit normal for a one-room in Ansan?',
   E'An agent showed me a one-room near Ansan station. The deposit feels high compared with what friends paid.\nWhat should I check before signing?',
   now() - interval '1 day 4 hours'),
  ('00000000-0000-4000-8000-000000000006', 'transit', 'experience', 'th',
   'ซื้อตั๋ว KTX ล่วงหน้าผ่านแอป',
   E'ซื้อล่วงหน้าหนึ่งสัปดาห์ได้ที่นั่งริมหน้าต่าง\nแอปมีภาษาอังกฤษ และจ่ายด้วยบัตรเครดิตต่างประเทศได้',
   now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000007', 'procedures', 'question', 'uz',
   'Koreys telefon raqamisiz bank ilovasida tasdiqlash',
   E'ARC kartam bor, lekin koreys telefon raqamim hali yoʻq.\nBank ilovasi telefon orqali tasdiqlashni soʻrayapti. Kimdir shunday holatga tushganmi?',
   now() - interval '2 days 6 hours'),
  ('00000000-0000-4000-8000-000000000008', 'daily', 'experience', 'en',
   'Weekend market with Filipino groceries',
   E'There is a Sunday market near Hyehwa station where you can find calamansi, dried fish and snacks from home.\nGo before noon, bring cash. Masarap!',
   now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000009', 'daily', 'question', 'mn',
   'Өвлийн дулаан куртка хаанаас хямд авах вэ?',
   E'Сөүлд анхны өвөл маань. Дулаан куртка хямд авах газар зөвлөөч.',
   now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000010', 'health', 'experience', 'id',
   'Pengalaman vaksin flu di puskesmas (보건소)',
   E'Bawa kartu ARC. Petugasnya bisa sedikit bahasa Inggris dan ada formulir dalam beberapa bahasa.\nTanya dulu lewat telepon soal jadwal vaksin.',
   now() - interval '5 days')
  RETURNING id, title
)
INSERT INTO boundless.comments (post_id, user_id, anon_no, body, created_at)
SELECT p.id, c.user_id::uuid, c.anon_no, c.body, now() - c.ago::interval
FROM p JOIN (VALUES
  ('Hỏi lịch bỏ rác tái chế ở khu Mapo', '00000000-0000-4000-8000-000000000007', 1,
   'Every building can be different. Ask the management office (관리사무소) first, they told me the exact days and the spot for boxes.', '30 minutes'),
  ('Hỏi lịch bỏ rác tái chế ở khu Mapo', '00000000-0000-4000-8000-000000000002', 0,
   'Cảm ơn! Mình sẽ hỏi văn phòng quản lý tòa nhà.', '20 minutes'),
  ('Topping up a transit card in Busan', '00000000-0000-4000-8000-000000000008', 1,
   'Most convenience stores can top up, but usually with cash. Subway stations have machines too.', '2 hours'),
  ('Topping up a transit card in Busan', '00000000-0000-4000-8000-000000000001', 0,
   'Thanks! Found a machine at Seomyeon station.', '1 hour'),
  ('没有健康保险，看牙医大概多少钱？', '00000000-0000-4000-8000-000000000011', 1,
   '保険なしだと検診だけでも数万ウォンかかりました。英語対応の歯科は 1345 に聞くと教えてくれます。', '20 hours'),
  ('Is this deposit normal for a one-room in Ansan?', '00000000-0000-4000-8000-000000000013', 1,
   'Check the building registry for loans on the property before signing, and ask for the contract in English if you can.', '1 day'),
  ('Is this deposit normal for a one-room in Ansan?', '00000000-0000-4000-8000-000000000012', 2,
   'Call my friend 010-0000-0000, he rents cheap rooms. (fictional sample of a reportable comment)', '23 hours')
) AS c(title, user_id, anon_no, body, ago) ON c.title = p.title;

-- One open report so the moderation queue has something to show.
INSERT INTO boundless.reports (reporter_id, comment_id, reason, details)
SELECT '00000000-0000-4000-8000-000000000005', id, 'privacy', 'Phone number in a reply (fictional sample)'
FROM boundless.comments WHERE body LIKE 'Call my friend%';

-- Community sample data: areas, solved, helpful votes, a nested reply, a saved post.
UPDATE boundless.posts SET region = 'seoul'
WHERE user_id::text LIKE '00000000-0000-4000-8000-%' AND (title LIKE 'Hỏi lịch%' OR title LIKE '没有健康%' OR title LIKE 'Weekend market%' OR title LIKE 'ARC renewal%');
UPDATE boundless.posts SET region = 'busan', solved = true WHERE title = 'Topping up a transit card in Busan';
UPDATE boundless.posts SET region = 'gyeonggi' WHERE title LIKE 'Is this deposit normal%';

INSERT INTO boundless.post_likes (post_id, user_id)
SELECT p.id, u.id::uuid FROM boundless.posts p
JOIN (VALUES
  ('ARC renewal at the immigration office: what I wish I knew', '00000000-0000-4000-8000-000000000002'),
  ('ARC renewal at the immigration office: what I wish I knew', '00000000-0000-4000-8000-000000000005'),
  ('ARC renewal at the immigration office: what I wish I knew', '00000000-0000-4000-8000-000000000007'),
  ('Topping up a transit card in Busan', '00000000-0000-4000-8000-000000000006'),
  ('Topping up a transit card in Busan', '00000000-0000-4000-8000-000000000011'),
  ('Weekend market with Filipino groceries', '00000000-0000-4000-8000-000000000010'),
  ('Weekend market with Filipino groceries', '00000000-0000-4000-8000-000000000009')
) AS u(title, id) ON u.title = p.title;

INSERT INTO boundless.comment_likes (comment_id, user_id)
SELECT id, '00000000-0000-4000-8000-000000000002' FROM boundless.comments WHERE body LIKE 'Every building can be different%';

INSERT INTO boundless.comments (post_id, user_id, anon_no, body, parent_id, created_at)
SELECT c.post_id, '00000000-0000-4000-8000-000000000001', 2,
  'Same in my building. The notice board in the lobby also had a small map of the bin area.', c.id, now() - interval '10 minutes'
FROM boundless.comments c WHERE c.body LIKE 'Every building can be different%';

INSERT INTO boundless.saves (user_id, post_id)
SELECT '00000000-0000-4000-8000-000000000002', id FROM boundless.posts WHERE title LIKE 'ARC renewal%';
