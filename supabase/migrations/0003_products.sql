-- The product catalogue, editable from the admin console (/admin/products).
--
-- Seeded from lib/data/products.ts below. `on conflict do nothing` means
-- running this again never overwrites what admins have changed.
--
-- `id` never changes once created: the product code customers quote comes
-- from it (BR-19), and carts and orders refer to it. Hidden products
-- (`active = false`) leave the shop and drop out of carts. Orders keep their
-- own copy of each name and price, so later edits never rewrite them.
--
-- Locked down like the other tables: only the server reads and writes.

create table public.products (
  id text primary key check (id ~ '^[a-z]+_[a-z0-9_]+$'),
  category text not null check (category in
    ('seedlings', 'seeds', 'containers', 'supports', 'fertilizers', 'protection', 'tools')),
  name jsonb not null check (
    jsonb_typeof(name -> 'en') = 'string' and length(name ->> 'en') > 0
    and jsonb_typeof(name -> 'si') = 'string'
    and jsonb_typeof(name -> 'ta') = 'string'
  ),
  unit text not null check (unit in ('each', 'packet', 'bag', 'kg', 'bottle', 'pack', 'block')),
  icon text not null default '🌱',
  image_path text,
  price numeric not null check (price >= 0),
  veg_id text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index products_active_sort_idx on public.products (active, sort_order, id);

alter table public.products enable row level security;

revoke all on table public.products from anon, authenticated;

insert into public.products (id, category, name, unit, icon, price, veg_id, sort_order) values
  ('s_tomato', 'seedlings', '{"en":"Tomato seedling (Thakkali)","si":"තක්කාලි පැළය","ta":"தக்காளி நாற்று"}'::jsonb, 'each', '🍅', 80, 'tomato', 10),
  ('s_chili', 'seedlings', '{"en":"Green chili seedling","si":"අමු මිරිස් පැළය","ta":"பச்சை மிளகாய் நாற்று"}'::jsonb, 'each', '🌶️', 60, 'chili', 20),
  ('s_brinjal', 'seedlings', '{"en":"Brinjal seedling (Wambatu)","si":"වම්බටු පැළය","ta":"கத்தரிக்காய் நாற்று"}'::jsonb, 'each', '🍆', 60, 'brinjal', 30),
  ('s_okra', 'seedlings', '{"en":"Okra seedling (Bandakka)","si":"බණ්ඩක්කා පැළය","ta":"வெண்டைக்காய் நாற்று"}'::jsonb, 'each', '🌿', 50, 'okra', 40),
  ('s_longbean', 'seedlings', '{"en":"Long bean seedling (Me karal)","si":"මෑ පැළය","ta":"பயிற்றங்காய் நாற்று"}'::jsonb, 'each', '🫛', 50, 'longbean', 50),
  ('s_bittergourd', 'seedlings', '{"en":"Bitter gourd seedling (Karawila)","si":"කරවිල පැළය","ta":"பாகற்காய் நாற்று"}'::jsonb, 'each', '🥒', 60, 'bittergourd', 60),
  ('s_snakegourd', 'seedlings', '{"en":"Snake gourd seedling (Pathola)","si":"පතෝල පැළය","ta":"புடலங்காய் நாற்று"}'::jsonb, 'each', '🐍', 60, 'snakegourd', 70),
  ('s_cucumber', 'seedlings', '{"en":"Cucumber seedling (Pipigna)","si":"පිපිඤ්ඤා පැළය","ta":"வெள்ளரிக்காய் நாற்று"}'::jsonb, 'each', '🥒', 60, 'cucumber', 80),
  ('s_capsicum', 'seedlings', '{"en":"Capsicum seedling (Malu miris)","si":"මාළු මිරිස් පැළය","ta":"குடைமிளகாய் நாற்று"}'::jsonb, 'each', '🫑', 90, 'capsicum', 90),
  ('s_kankun', 'seedlings', '{"en":"Kankun seedling","si":"කංකුං පැළය","ta":"வள்ளல் கீரை நாற்று"}'::jsonb, 'each', '🥬', 40, 'kankun', 100),
  ('s_gotukola', 'seedlings', '{"en":"Gotukola seedling","si":"ගොටුකොළ පැළය","ta":"வல்லாரை நாற்று"}'::jsonb, 'each', '🍀', 50, 'gotukola', 110),
  ('sd_tomato', 'seeds', '{"en":"Tomato seeds","si":"තක්කාලි බීජ","ta":"தக்காளி விதைகள்"}'::jsonb, 'packet', '🌱', 150, null, 120),
  ('sd_chili', 'seeds', '{"en":"Green chili seeds","si":"අමු මිරිස් බීජ","ta":"பச்சை மிளகாய் விதைகள்"}'::jsonb, 'packet', '🌱', 120, null, 130),
  ('sd_brinjal', 'seeds', '{"en":"Brinjal seeds","si":"වම්බටු බීජ","ta":"கத்தரிக்காய் விதைகள்"}'::jsonb, 'packet', '🌱', 120, null, 140),
  ('sd_okra', 'seeds', '{"en":"Okra seeds","si":"බණ්ඩක්කා බීජ","ta":"வெண்டைக்காய் விதைகள்"}'::jsonb, 'packet', '🌱', 100, null, 150),
  ('sd_longbean', 'seeds', '{"en":"Long bean seeds","si":"මෑ බීජ","ta":"பயிற்றங்காய் விதைகள்"}'::jsonb, 'packet', '🌱', 100, null, 160),
  ('sd_bittergourd', 'seeds', '{"en":"Bitter gourd seeds","si":"කරවිල බීජ","ta":"பாகற்காய் விதைகள்"}'::jsonb, 'packet', '🌱', 130, null, 170),
  ('sd_snakegourd', 'seeds', '{"en":"Snake gourd seeds","si":"පතෝල බීජ","ta":"புடலங்காய் விதைகள்"}'::jsonb, 'packet', '🌱', 130, null, 180),
  ('sd_cucumber', 'seeds', '{"en":"Cucumber seeds","si":"පිපිඤ්ඤා බීජ","ta":"வெள்ளரி விதைகள்"}'::jsonb, 'packet', '🌱', 130, null, 190),
  ('sd_capsicum', 'seeds', '{"en":"Capsicum seeds","si":"මාළු මිරිස් බීජ","ta":"குடைமிளகாய் விதைகள்"}'::jsonb, 'packet', '🌱', 200, null, 200),
  ('sd_radish', 'seeds', '{"en":"Radish seeds","si":"රාබු බීජ","ta":"முள்ளங்கி விதைகள்"}'::jsonb, 'packet', '🌱', 100, null, 210),
  ('sd_mukunuwenna', 'seeds', '{"en":"Mukunuwenna seeds","si":"මුකුණුවැන්න බීජ","ta":"பொன்னாங்கண்ணி விதைகள்"}'::jsonb, 'packet', '🌱', 100, null, 220),
  ('k_gb15', 'containers', '{"en":"Grow bag 15 L","si":"වගා බෑගය ලීටර් 15","ta":"வளர்ப்பு பை 15 லி"}'::jsonb, 'each', '🛍️', 250, null, 230),
  ('k_gb25', 'containers', '{"en":"Grow bag 25 L","si":"වගා බෑගය ලීටර් 25","ta":"வளர்ப்பு பை 25 லி"}'::jsonb, 'each', '🛍️', 350, null, 240),
  ('k_pot12', 'containers', '{"en":"Plastic pot 12 in","si":"ප්ලාස්ටික් බඳුන අඟල් 12","ta":"பிளாஸ்டிக் தொட்டி 12 அங்"}'::jsonb, 'each', '🪴', 300, null, 250),
  ('k_pot8', 'containers', '{"en":"Plastic pot 8 in","si":"ප්ලාස්ටික් බඳුන අඟල් 8","ta":"பிளாஸ்டிக் தொட்டி 8 அங்"}'::jsonb, 'each', '🪴', 180, null, 260),
  ('k_tray', 'containers', '{"en":"Seedling tray (50 cells)","si":"පැළ තැටිය (කුටීර 50)","ta":"நாற்று தட்டு (50 குழிகள்)"}'::jsonb, 'each', '🧇', 250, null, 270),
  ('k_window', 'containers', '{"en":"Window box 60 cm","si":"ජනෙල් පෙට්ටිය සෙ.මී. 60","ta":"சாளரப் பெட்டி 60 செ.மீ"}'::jsonb, 'each', '📦', 900, null, 280),
  ('p_trellis', 'supports', '{"en":"Trellis net 2 x 3 m","si":"වැල් දැල මී. 2 x 3","ta":"கொடி வலை 2 x 3 மீ"}'::jsonb, 'each', '🕸️', 650, null, 290),
  ('p_stake', 'supports', '{"en":"Bamboo stakes (10)","si":"උණ කූරු (10)","ta":"மூங்கில் குச்சிகள் (10)"}'::jsonb, 'pack', '🎋', 300, null, 300),
  ('p_tie', 'supports', '{"en":"Soft plant ties","si":"මෘදු පැළ බැඳුම්","ta":"மென்மையான செடி கட்டிகள்"}'::jsonb, 'pack', '🧵', 150, null, 310),
  ('p_shade', 'supports', '{"en":"Shade net 2 x 2 m","si":"සෙවන දැල මී. 2 x 2","ta":"நிழல் வலை 2 x 2 மீ"}'::jsonb, 'each', '⛱️', 900, null, 320),
  ('f_compost', 'fertilizers', '{"en":"Compost (10 kg bag)","si":"කොම්පෝස්ට් (කි.ග්‍රෑ. 10 බෑගය)","ta":"உரம் (10 கி.கி பை)"}'::jsonb, 'bag', '🟫', 650, null, 330),
  ('f_organic', 'fertilizers', '{"en":"Organic fertilizer","si":"කාබනික පොහොර","ta":"இயற்கை உரம்"}'::jsonb, 'kg', '🌾', 300, null, 340),
  ('f_cocopeat', 'fertilizers', '{"en":"Coco peat block (5 kg)","si":"කොහු බත් කුට්ටිය (කි.ග්‍රෑ. 5)","ta":"தேங்காய் நார்க்கட்டி (5 கி.கி)"}'::jsonb, 'block', '🥥', 450, null, 350),
  ('f_vermi', 'fertilizers', '{"en":"Vermicompost (5 kg bag)","si":"ගැඩවිල් පොහොර (කි.ග්‍රෑ. 5)","ta":"மண்புழு உரம் (5 கி.கி பை)"}'::jsonb, 'bag', '🪱', 700, null, 360),
  ('f_bone', 'fertilizers', '{"en":"Bone meal","si":"ඇට කුඩු","ta":"எலும்புத் தூள்"}'::jsonb, 'kg', '🦴', 400, null, 370),
  ('f_seaweed', 'fertilizers', '{"en":"Liquid seaweed feed (500 ml)","si":"මුහුදු පැලෑටි දියර පොහොර (මි.ලී. 500)","ta":"கடற்பாசி திரவ உரம் (500 மி.லி)"}'::jsonb, 'bottle', '🌊', 750, null, 380),
  ('f_dolomite', 'fertilizers', '{"en":"Dolomite lime","si":"ඩොලමයිට්","ta":"டோலமைட் சுண்ணாம்பு"}'::jsonb, 'kg', '⚪', 200, null, 390),
  ('c_neem', 'protection', '{"en":"Neem oil (500 ml)","si":"කොහොඹ තෙල් (මි.ලී. 500)","ta":"வேப்ப எண்ணெய் (500 மி.லி)"}'::jsonb, 'bottle', '🧴', 650, null, 400),
  ('c_trap', 'protection', '{"en":"Yellow sticky traps (5)","si":"කහ ඇලෙන උගුල් (5)","ta":"மஞ்சள் ஒட்டும் பொறிகள் (5)"}'::jsonb, 'pack', '🟨', 400, null, 410),
  ('c_soap', 'protection', '{"en":"Insecticidal soap (500 ml)","si":"කෘමිනාශක සබන් (මි.ලී. 500)","ta":"பூச்சிக்கொல்லி சோப்பு (500 மி.லி)"}'::jsonb, 'bottle', '🫧', 550, null, 420),
  ('c_fruitfly', 'protection', '{"en":"Fruit fly trap","si":"පලතුරු මැස්සන් උගුල","ta":"பழ ஈ பொறி"}'::jsonb, 'each', '🪰', 450, null, 430),
  ('c_net', 'protection', '{"en":"Insect net 2 x 2 m","si":"කෘමි දැල මී. 2 x 2","ta":"பூச்சி வலை 2 x 2 மீ"}'::jsonb, 'each', '🥅', 800, null, 440),
  ('t_can', 'tools', '{"en":"Watering can 5 L","si":"වතුර දමන භාජනය ලී. 5","ta":"நீர் ஊற்றும் கேன் 5 லி"}'::jsonb, 'each', '🚿', 750, null, 450),
  ('t_shears', 'tools', '{"en":"Pruning shears","si":"කප්පාදු කතුර","ta":"கத்தரிக்கோல்"}'::jsonb, 'each', '✂️', 950, null, 460),
  ('t_trowel', 'tools', '{"en":"Hand trowel","si":"අත් හැන්ද","ta":"கை மண்வெட்டி"}'::jsonb, 'each', '🥄', 450, null, 470),
  ('t_fork', 'tools', '{"en":"Hand fork","si":"අත් ගෑරුප්පුව","ta":"கை முட்கரண்டி"}'::jsonb, 'each', '🍴', 450, null, 480),
  ('t_sprayer', 'tools', '{"en":"Hand sprayer 1 L","si":"අත් ඉසින යන්ත්‍රය ලී. 1","ta":"கை தெளிப்பான் 1 லி"}'::jsonb, 'each', '💦', 650, null, 490),
  ('t_gloves', 'tools', '{"en":"Garden gloves","si":"උයන් අත්වැසුම්","ta":"தோட்டக் கையுறைகள்"}'::jsonb, 'each', '🧤', 350, null, 500),
  ('t_ph', 'tools', '{"en":"Soil pH meter","si":"පස් pH මීටරය","ta":"மண் pH மீட்டர்"}'::jsonb, 'each', '📟', 2500, null, 510)
on conflict (id) do nothing;

-- Product photos. Public to read, so the shop can show them; uploads and
-- deletes go through the server with the secret key, which bypasses storage
-- policies. The limits here back up the server's own checks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
