-- FICTIONAL demo data for local development and demos. Never run against production for real users.
-- All accounts use @example.com (one-click sample accounts are <country code>@example.com) and are re-created on every run.
DELETE FROM boundless.users WHERE email LIKE '%@example.com' AND email NOT IN ('admin@example.com');

INSERT INTO boundless.users (id, email, nationality, region, created_at) VALUES
  ('00000000-0000-4000-8000-000000000001', 'fr@example.com', 'FR', 'seoul', now() - interval '20 days'),
  ('00000000-0000-4000-8000-000000000002', 'vn@example.com', 'VN', 'seoul', now() - interval '18 days'),
  ('00000000-0000-4000-8000-000000000003', 'us@example.com', 'US', 'seoul', now() - interval '17 days'),
  ('00000000-0000-4000-8000-000000000004', 'cn@example.com', 'CN', 'seoul', now() - interval '15 days'),
  ('00000000-0000-4000-8000-000000000005', 'np@example.com', 'NP', 'gyeonggi', now() - interval '14 days'),
  ('00000000-0000-4000-8000-000000000006', 'th@example.com', 'TH', 'busan', now() - interval '12 days'),
  ('00000000-0000-4000-8000-000000000007', 'uz@example.com', 'UZ', 'seoul', now() - interval '11 days'),
  ('00000000-0000-4000-8000-000000000008', 'ph@example.com', 'PH', 'seoul', now() - interval '10 days'),
  ('00000000-0000-4000-8000-000000000009', 'mn@example.com', 'MN', 'seoul', now() - interval '9 days'),
  ('00000000-0000-4000-8000-000000000010', 'id@example.com', 'ID', 'incheon', now() - interval '8 days'),
  ('00000000-0000-4000-8000-000000000011', 'jp@example.com', 'JP', 'seoul', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000012', 'kz@example.com', 'KZ', 'seoul', now() - interval '6 days'),
  ('00000000-0000-4000-8000-000000000013', 'ca@example.com', 'CA', 'seoul', now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000014', 'kh@example.com', 'KH', 'gyeonggi', now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000015', 'ru@example.com', 'RU', 'seoul', now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000016', 'in@example.com', 'IN', 'busan', now() - interval '2 days');

-- Posts: (author suffix, space, board, tag, lang, region, title, body, price, place, start offset, end offset, age)
INSERT INTO boundless.posts (user_id, space, topic, kind, lang, region, title, body, price, deal, place, starts_on, ends_on, created_at)
SELECT ('00000000-0000-4000-8000-0000000000' || a)::uuid, sp, b, k, l, NULLIF(r, ''), ti, bo, pr, CASE WHEN pr IS NULL THEN NULL ELSE 'open' END, NULLIF(pl, ''),
       CASE WHEN s0 IS NULL THEN NULL ELSE current_date + s0 END, CASE WHEN e0 IS NULL THEN NULL ELSE current_date + e0 END, now() - ag::interval
FROM (VALUES
  ('02', 'global', 'housing', 'question', 'vi', 'seoul', 'Hỏi lịch bỏ rác tái chế ở khu Mapo',
   E'Mình mới chuyển đến Mapo-gu. Hộp các-tông và chai nhựa thì bỏ vào ngày nào, ở đâu?\nThông báo của tòa nhà chỉ có tiếng Hàn nên mình chưa hiểu.', NULL::int, '', NULL::int, NULL::int, '50 minutes'),
  ('01', 'global', 'transit', 'question', 'en', 'busan', 'Topping up a transit card in Busan',
   E'I''m in Busan this week. Where can I top up a transit card?\nDo convenience stores accept foreign cards for top-ups?', NULL, '', NULL, NULL, '3 hours'),
  ('03', 'global', 'visa', 'review', 'en', 'seoul', 'ARC renewal at the immigration office: what I wish I knew',
   E'Book the visit online well ahead; slots fill up weeks in advance.\nBring your lease contract, passport, and a recent photo. Ask the officer which documents apply to your visa type, mine needed one extra form.', NULL, '', NULL, NULL, '9 hours'),
  ('04', 'global', 'health', 'question', 'zh', 'seoul', '没有健康保险，看牙医大概多少钱？',
   E'牙疼两天了，我还没有加入国民健康保险。\n有没有人知道普通检查和补牙大概要多少钱？我住在首尔麻浦区附近。', NULL, '', NULL, NULL, '1 day'),
  ('05', 'global', 'housing', 'question', 'en', 'gyeonggi', 'Is this deposit normal for a one-room in Ansan?',
   E'An agent showed me a one-room near Ansan station. The deposit feels high compared with what friends paid.\nWhat should I check before signing?', NULL, '', NULL, NULL, '1 day 4 hours'),
  ('06', 'global', 'transit', 'review', 'th', 'busan', 'ซื้อตั๋ว KTX ล่วงหน้าผ่านแอป',
   E'ซื้อล่วงหน้าหนึ่งสัปดาห์ได้ที่นั่งริมหน้าต่าง\nแอปมีภาษาอังกฤษ และจ่ายด้วยบัตรเครดิตต่างประเทศได้', NULL, '', NULL, NULL, '2 days'),
  ('07', 'global', 'visa', 'question', 'uz', 'seoul', 'Koreys telefon raqamisiz bank ilovasida tasdiqlash',
   E'ARC kartam bor, lekin koreys telefon raqamim hali yoʻq.\nBank ilovasi telefon orqali tasdiqlashni soʻrayapti. Kimdir shunday holatga tushganmi?', NULL, '', NULL, NULL, '2 days 6 hours'),
  ('08', 'global', 'food', 'recommend', 'en', 'seoul', 'Weekend market with Filipino groceries',
   E'There is a Sunday market near Hyehwa station where you can find calamansi, dried fish and snacks from home.\nGo before noon, bring cash. Masarap!', NULL, '혜화역', NULL, NULL, '3 days'),
  ('09', 'global', 'chat', 'question', 'mn', 'seoul', 'Өвлийн дулаан куртка хаанаас хямд авах вэ?',
   'Сөүлд анхны өвөл маань. Дулаан куртка хямд авах газар зөвлөөч.', NULL, '', NULL, NULL, '4 days'),
  ('10', 'global', 'health', 'review', 'id', 'incheon', 'Pengalaman vaksin flu di puskesmas (보건소)',
   E'Bawa kartu ARC. Petugasnya bisa sedikit bahasa Inggris dan ada formulir dalam beberapa bahasa.\nTanya dulu lewat telepon soal jadwal vaksin.', NULL, '', NULL, NULL, '5 days'),
  ('14', 'global', 'visa', 'question', 'km', 'gyeonggi', 'ការប្តូរអាសយដ្ឋាននៅលើកាតស្នាក់នៅ',
   'ខ្ញុំទើបផ្លាស់ផ្ទះ។ តើត្រូវយកឯកសារអ្វីខ្លះទៅការិយាល័យ?', NULL, '', NULL, NULL, '6 hours'),
  ('15', 'global', 'health', 'review', 'ru', 'seoul', 'Как я сходил к врачу без корейского',
   E'Взял переводчик в телефоне и заранее распечатал симптомы на корейском.\nВрач всё понял, приём занял десять минут.', NULL, '', NULL, NULL, '20 hours'),
  ('16', 'global', 'food', 'question', 'hi', 'busan', 'बुसान में भारतीय किराने का सामान कहाँ मिलेगा?',
   'मसाले और दाल कहाँ से खरीदें? कोई दुकान बताइए।', NULL, '', NULL, NULL, '2 hours'),
  ('11', 'global', 'popup', 'info', 'ja', 'seoul', '聖水洞のキャラクターポップアップ、今週末まで',
   E'聖水洞で人気キャラクターのポップアップが開催中です。\n平日の午前中は空いていました。英語の案内もあります。', NULL, '성수동', -3, 4, '5 hours'),
  ('03', 'global', 'popup', 'together', 'en', 'seoul', 'Anyone going to the lantern festival this weekend?',
   E'The lantern festival along the stream starts this Friday. I''d love to go with a few people on Saturday evening.\nWe can meet at the station exit and walk together.', NULL, '청계천', 1, 15, '8 hours'),
  ('01', 'global', 'market', 'sell', 'en', 'seoul', 'Selling a desk and chair before I move out',
   E'White desk (120 cm) and an office chair, used for one year, no scratches.\nPick up only, I can help carry it to the elevator.', 40000, '마포구 합정역', NULL, NULL, '4 hours'),
  ('02', 'global', 'market', 'free', 'vi', 'seoul', 'Tặng nồi cơm điện còn dùng tốt',
   E'Mình về nước nên tặng nồi cơm điện 6 người ăn, còn chạy tốt.\nAi cần thì bình luận nhé, nhận ở gần ga Sillim.', 0, '관악구 신림역', NULL, NULL, '7 hours'),
  ('08', 'global', 'love', 'worry', 'en', 'seoul', 'Meeting my Korean partner''s parents for Chuseok',
   E'We''ve been together two years and I''m meeting his parents for the first time over the holiday.\nWhat should I bring, and how formal should I be? Any international couples here with tips?', NULL, '', NULL, NULL, '10 hours'),
  ('12', 'global', 'chat', 'funny', 'ru', 'seoul', 'Аджумма в метро научила меня корейскому',
   E'Сегодня в метро аджумма увидела, что я учу корейский, и десять минут исправляла моё произношение.\nВышли на одной станции, она дала мне мандарин. Люблю Сеул.', NULL, '', NULL, NULL, '1 day 2 hours'),
  ('10', 'global', 'korean', 'question', 'id', '', 'Arti “수고하세요” dan kapan dipakai?',
   E'Saya sering dengar orang bilang 수고하세요 waktu keluar dari toko.\nApakah sopan kalau saya pakai ke atasan di kantor?', NULL, '', NULL, NULL, '12 hours'),
  ('05', 'global', 'work', 'question', 'en', 'gyeonggi', 'Can I work part-time on a D-2 student visa?',
   E'I started a master''s program this semester. Some cafés near campus are hiring.\nDo I need permission first, and how many hours are allowed?', NULL, '', NULL, NULL, '1 day 8 hours'),
  ('13', 'global', 'trip', 'recommend', 'en', 'gyeonggi', 'Easy day trip: Gapyeong by ITX',
   E'ITX from Yongsan takes about an hour. Rent a bike near the station and ride along the river.\nBring cash for the small restaurants, and check the last train time.', NULL, '가평역', NULL, NULL, '2 days 3 hours'),
  ('04', 'global', 'food', 'home', 'zh', 'seoul', '大林洞的地道中国菜',
   E'想吃家乡菜可以去大林洞，麻辣烫和烤串都很正宗。\n周末人多，建议工作日晚上去。', NULL, '대림동', NULL, NULL, '3 days 2 hours'),
  ('06', 'global', 'chat', 'chat', 'th', 'busan', 'คิดถึงบ้านจัง',
   E'อากาศเริ่มหนาวแล้ว คิดถึงอาหารแม่มาก\nใครมีร้านอาหารไทยอร่อยๆ ในปูซานแนะนำบ้าง', NULL, '', NULL, NULL, '1 day 5 hours'),
  -- Country lounges (only that nationality can see them)
  ('02', 'VN', 'lounge', 'meetup', 'vi', 'seoul', 'Cuối tuần này ai đi ăn phở ở Itaewon không?',
   E'Mình muốn rủ vài bạn người Việt đi ăn phở và cà phê.\nThứ bảy 12 giờ trưa, ai đi thì bình luận nhé.', NULL, '', NULL, NULL, '1 hour'),
  ('02', 'VN', 'lounge', 'question', 'vi', 'seoul', 'Kinh nghiệm chuyển visa D-10 sang E-7?',
   'Bạn nào đã chuyển từ D-10 sang E-7 rồi cho mình hỏi cần chuẩn bị những gì?', NULL, '', NULL, NULL, '1 day'),
  ('11', 'JP', 'lounge', 'info', 'ja', 'seoul', '日本の食材が買えるお店まとめ',
   E'東部二村洞のスーパーに日本の調味料とお菓子があります。\n納豆は冷凍コーナーです。', NULL, '', NULL, NULL, '9 hours'),
  ('07', 'UZ', 'lounge', 'info', 'uz', 'seoul', 'Dongdaemunda mazali osh',
   'Dongdaemun yonida oʻzbek oshxonasi bor. Palov va somsa juda mazali.', NULL, '', NULL, NULL, '2 days'),
  ('04', 'CN', 'lounge', 'chat', 'zh', 'seoul', '在首尔过中秋的朋友们',
   '今年中秋不能回家，有没有一起吃月饼的朋友？', NULL, '', NULL, NULL, '3 days')
) AS v(a, sp, b, k, l, r, ti, bo, pr, pl, s0, e0, ag);

UPDATE boundless.posts SET solved = true WHERE title = 'Topping up a transit card in Busan';

-- Replies: (post title, author suffix, anonymous number, body, age)
INSERT INTO boundless.comments (post_id, user_id, anon_no, body, created_at)
SELECT p.id, ('00000000-0000-4000-8000-0000000000' || c.a)::uuid, c.n, c.body, now() - c.ago::interval
FROM boundless.posts p JOIN (VALUES
  ('Hỏi lịch bỏ rác tái chế ở khu Mapo', '07', 1, 'Every building can be different. Ask the management office (관리사무소) first, they told me the exact days and the spot for boxes.', '30 minutes'),
  ('Hỏi lịch bỏ rác tái chế ở khu Mapo', '02', 0, 'Cảm ơn! Mình sẽ hỏi văn phòng quản lý tòa nhà.', '20 minutes'),
  ('Topping up a transit card in Busan', '08', 1, 'Most convenience stores can top up, but usually with cash. Subway stations have machines too.', '2 hours'),
  ('Topping up a transit card in Busan', '01', 0, 'Thanks! Found a machine at Seomyeon station.', '1 hour'),
  ('没有健康保险，看牙医大概多少钱？', '11', 1, '保険なしだと検診だけでも数万ウォンかかりました。英語対応の歯科は 1345 に聞くと教えてくれます。', '20 hours'),
  ('Is this deposit normal for a one-room in Ansan?', '13', 1, 'Check the building registry for loans on the property before signing, and ask for the contract in English if you can.', '1 day'),
  ('Is this deposit normal for a one-room in Ansan?', '12', 2, 'Call my friend 010-0000-0000, he rents cheap rooms. (fictional sample of a reportable comment)', '23 hours'),
  ('बुसान में भारतीय किराने का सामान कहाँ मिलेगा?', '05', 1, 'Try the Nepali and Indian grocery shops near Busan station. They have dal, rice and most spices.', '1 hour'),
  ('Selling a desk and chair before I move out', '09', 1, 'Is the chair height adjustable? I could pick it up on Sunday.', '3 hours'),
  ('Selling a desk and chair before I move out', '01', 0, 'Yes it is! Sunday afternoon works.', '2 hours'),
  ('Meeting my Korean partner''s parents for Chuseok', '11', 1, 'A fruit or meat gift set from a department store is classic. Bow when you greet them and let them start eating first.', '9 hours'),
  ('Meeting my Korean partner''s parents for Chuseok', '13', 2, 'Learn a few polite phrases like 처음 뵙겠습니다. They will love the effort.', '8 hours'),
  ('Arti “수고하세요” dan kapan dipakai?', '04', 1, 'It is fine with shop staff, but to a boss it can sound a bit odd. Use 먼저 가보겠습니다 when you leave the office.', '11 hours'),
  ('Can I work part-time on a D-2 student visa?', '03', 1, 'You need permission from immigration first (HiKorea). Hours are limited during the semester, check the current rule for your level.', '1 day 6 hours'),
  ('Аджумма в метро научила меня корейскому', '02', 1, 'Haha the mandarin is the best part!', '1 day'),
  ('คิดถึงบ้านจัง', '16', 1, 'There is a Thai restaurant near Seomyeon with real som tam!', '1 day 3 hours'),
  ('Cuối tuần này ai đi ăn phở ở Itaewon không?', '02', 0, 'Mình sẽ đặt bàn cho 4 người nhé.', '30 minutes')
) AS c(title, a, n, body, ago) ON c.title = p.title;

-- A nested reply.
INSERT INTO boundless.comments (post_id, user_id, anon_no, body, parent_id, created_at)
SELECT c.post_id, '00000000-0000-4000-8000-000000000001', 2,
  'Same in my building. The notice board in the lobby also had a small map of the bin area.', c.id, now() - interval '10 minutes'
FROM boundless.comments c WHERE c.body LIKE 'Every building can be different%';

-- Helpful votes on posts.
INSERT INTO boundless.post_likes (post_id, user_id)
SELECT p.id, ('00000000-0000-4000-8000-0000000000' || u.a)::uuid FROM boundless.posts p
JOIN (VALUES
  ('ARC renewal at the immigration office: what I wish I knew', '02'), ('ARC renewal at the immigration office: what I wish I knew', '05'), ('ARC renewal at the immigration office: what I wish I knew', '07'),
  ('Topping up a transit card in Busan', '06'), ('Topping up a transit card in Busan', '11'),
  ('Weekend market with Filipino groceries', '10'), ('Weekend market with Filipino groceries', '09'),
  ('聖水洞のキャラクターポップアップ、今週末まで', '03'), ('聖水洞のキャラクターポップアップ、今週末まで', '08'), ('聖水洞のキャラクターポップアップ、今週末まで', '13'),
  ('Easy day trip: Gapyeong by ITX', '01'), ('Easy day trip: Gapyeong by ITX', '15'),
  ('Аджумма в метро научила меня корейскому', '04'), ('Аджумма в метро научила меня корейскому', '06'), ('Аджумма в метро научила меня корейскому', '16')
) AS u(title, a) ON u.title = p.title;

-- Helpful votes on replies.
INSERT INTO boundless.comment_likes (comment_id, user_id)
SELECT c.id, ('00000000-0000-4000-8000-0000000000' || u.a)::uuid FROM boundless.comments c
JOIN (VALUES
  ('Every building can be different%', '02'), ('Every building can be different%', '05'), ('Every building can be different%', '14'),
  ('Most convenience stores can top up%', '01'), ('Most convenience stores can top up%', '06'),
  ('A fruit or meat gift set%', '08'), ('A fruit or meat gift set%', '02'), ('A fruit or meat gift set%', '12'),
  ('You need permission from immigration first%', '05'), ('You need permission from immigration first%', '10'),
  ('Check the building registry%', '05'), ('Try the Nepali and Indian grocery%', '16')
) AS u(prefix, a) ON c.body LIKE u.prefix;

INSERT INTO boundless.saves (user_id, post_id)
SELECT '00000000-0000-4000-8000-000000000002', id FROM boundless.posts WHERE title LIKE 'ARC renewal%';

-- One open report so the moderation queue has something to show.
INSERT INTO boundless.reports (reporter_id, comment_id, reason, details)
SELECT '00000000-0000-4000-8000-000000000005', id, 'privacy', 'Phone number in a reply (fictional sample)'
FROM boundless.comments WHERE body LIKE 'Call my friend%';
