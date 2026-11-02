/**
 * ==== PRODUCT CATALOGUE (SRS 4.1) ====
 *
 * Shop prices in LKR. The product code shown to customers is derived from the
 * ID (BR-19), so changing an ID changes its code. `vegId` links a seedling to
 * its vegetable and grow guide. Prices are estimates until confirmed (OI-01).
 */
import type { Localized } from "../i18n/types";

export const CATEGORIES = [
  "seedlings",
  "seeds",
  "containers",
  "supports",
  "fertilizers",
  "protection",
  "tools",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Translated in lib/i18n/strings.ts under `unit.*`
export type Unit = "each" | "packet" | "bag" | "kg" | "bottle" | "pack" | "block";

export type Product = {
  id: string;
  category: Category;
  name: Localized;
  unit: Unit;
  icon: string;
  price: number;
  vegId?: string;
};

export const PRODUCTS: Product[] = [
  // ---- Seedlings ----
  { id: "s_tomato", category: "seedlings", vegId: "tomato", icon: "🍅", unit: "each", price: 80,
    name: { en: "Tomato seedling (Thakkali)", si: "තක්කාලි පැළය", ta: "தக்காளி நாற்று" } },
  { id: "s_chili", category: "seedlings", vegId: "chili", icon: "🌶️", unit: "each", price: 60,
    name: { en: "Green chili seedling", si: "අමු මිරිස් පැළය", ta: "பச்சை மிளகாய் நாற்று" } },
  { id: "s_brinjal", category: "seedlings", vegId: "brinjal", icon: "🍆", unit: "each", price: 60,
    name: { en: "Brinjal seedling (Wambatu)", si: "වම්බටු පැළය", ta: "கத்தரிக்காய் நாற்று" } },
  { id: "s_okra", category: "seedlings", vegId: "okra", icon: "🌿", unit: "each", price: 50,
    name: { en: "Okra seedling (Bandakka)", si: "බණ්ඩක්කා පැළය", ta: "வெண்டைக்காய் நாற்று" } },
  { id: "s_longbean", category: "seedlings", vegId: "longbean", icon: "🫛", unit: "each", price: 50,
    name: { en: "Long bean seedling (Me karal)", si: "මෑ පැළය", ta: "பயிற்றங்காய் நாற்று" } },
  { id: "s_bittergourd", category: "seedlings", vegId: "bittergourd", icon: "🥒", unit: "each", price: 60,
    name: { en: "Bitter gourd seedling (Karawila)", si: "කරවිල පැළය", ta: "பாகற்காய் நாற்று" } },
  { id: "s_snakegourd", category: "seedlings", vegId: "snakegourd", icon: "🐍", unit: "each", price: 60,
    name: { en: "Snake gourd seedling (Pathola)", si: "පතෝල පැළය", ta: "புடலங்காய் நாற்று" } },
  { id: "s_cucumber", category: "seedlings", vegId: "cucumber", icon: "🥒", unit: "each", price: 60,
    name: { en: "Cucumber seedling (Pipigna)", si: "පිපිඤ්ඤා පැළය", ta: "வெள்ளரிக்காய் நாற்று" } },
  { id: "s_capsicum", category: "seedlings", vegId: "capsicum", icon: "🫑", unit: "each", price: 90,
    name: { en: "Capsicum seedling (Malu miris)", si: "මාළු මිරිස් පැළය", ta: "குடைமிளகாய் நாற்று" } },
  { id: "s_kankun", category: "seedlings", vegId: "kankun", icon: "🥬", unit: "each", price: 40,
    name: { en: "Kankun seedling", si: "කංකුං පැළය", ta: "வள்ளல் கீரை நாற்று" } },
  { id: "s_gotukola", category: "seedlings", vegId: "gotukola", icon: "🍀", unit: "each", price: 50,
    name: { en: "Gotukola seedling", si: "ගොටුකොළ පැළය", ta: "வல்லாரை நாற்று" } },

  // ---- Seeds ----
  { id: "sd_tomato", category: "seeds", icon: "🌱", unit: "packet", price: 150,
    name: { en: "Tomato seeds", si: "තක්කාලි බීජ", ta: "தக்காளி விதைகள்" } },
  { id: "sd_chili", category: "seeds", icon: "🌱", unit: "packet", price: 120,
    name: { en: "Green chili seeds", si: "අමු මිරිස් බීජ", ta: "பச்சை மிளகாய் விதைகள்" } },
  { id: "sd_brinjal", category: "seeds", icon: "🌱", unit: "packet", price: 120,
    name: { en: "Brinjal seeds", si: "වම්බටු බීජ", ta: "கத்தரிக்காய் விதைகள்" } },
  { id: "sd_okra", category: "seeds", icon: "🌱", unit: "packet", price: 100,
    name: { en: "Okra seeds", si: "බණ්ඩක්කා බීජ", ta: "வெண்டைக்காய் விதைகள்" } },
  { id: "sd_longbean", category: "seeds", icon: "🌱", unit: "packet", price: 100,
    name: { en: "Long bean seeds", si: "මෑ බීජ", ta: "பயிற்றங்காய் விதைகள்" } },
  { id: "sd_bittergourd", category: "seeds", icon: "🌱", unit: "packet", price: 130,
    name: { en: "Bitter gourd seeds", si: "කරවිල බීජ", ta: "பாகற்காய் விதைகள்" } },
  { id: "sd_snakegourd", category: "seeds", icon: "🌱", unit: "packet", price: 130,
    name: { en: "Snake gourd seeds", si: "පතෝල බීජ", ta: "புடலங்காய் விதைகள்" } },
  { id: "sd_cucumber", category: "seeds", icon: "🌱", unit: "packet", price: 130,
    name: { en: "Cucumber seeds", si: "පිපිඤ්ඤා බීජ", ta: "வெள்ளரி விதைகள்" } },
  { id: "sd_capsicum", category: "seeds", icon: "🌱", unit: "packet", price: 200,
    name: { en: "Capsicum seeds", si: "මාළු මිරිස් බීජ", ta: "குடைமிளகாய் விதைகள்" } },
  { id: "sd_radish", category: "seeds", icon: "🌱", unit: "packet", price: 100,
    name: { en: "Radish seeds", si: "රාබු බීජ", ta: "முள்ளங்கி விதைகள்" } },
  { id: "sd_mukunuwenna", category: "seeds", icon: "🌱", unit: "packet", price: 100,
    name: { en: "Mukunuwenna seeds", si: "මුකුණුවැන්න බීජ", ta: "பொன்னாங்கண்ணி விதைகள்" } },

  // ---- Containers ----
  { id: "k_gb15", category: "containers", icon: "🛍️", unit: "each", price: 250,
    name: { en: "Grow bag 15 L", si: "වගා බෑගය ලීටර් 15", ta: "வளர்ப்பு பை 15 லி" } },
  { id: "k_gb25", category: "containers", icon: "🛍️", unit: "each", price: 350,
    name: { en: "Grow bag 25 L", si: "වගා බෑගය ලීටර් 25", ta: "வளர்ப்பு பை 25 லி" } },
  { id: "k_pot12", category: "containers", icon: "🪴", unit: "each", price: 300,
    name: { en: "Plastic pot 12 in", si: "ප්ලාස්ටික් බඳුන අඟල් 12", ta: "பிளாஸ்டிக் தொட்டி 12 அங்" } },
  { id: "k_pot8", category: "containers", icon: "🪴", unit: "each", price: 180,
    name: { en: "Plastic pot 8 in", si: "ප්ලාස්ටික් බඳුන අඟල් 8", ta: "பிளாஸ்டிக் தொட்டி 8 அங்" } },
  { id: "k_tray", category: "containers", icon: "🧇", unit: "each", price: 250,
    name: { en: "Seedling tray (50 cells)", si: "පැළ තැටිය (කුටීර 50)", ta: "நாற்று தட்டு (50 குழிகள்)" } },
  { id: "k_window", category: "containers", icon: "📦", unit: "each", price: 900,
    name: { en: "Window box 60 cm", si: "ජනෙල් පෙට්ටිය සෙ.මී. 60", ta: "சாளரப் பெட்டி 60 செ.மீ" } },

  // ---- Supports ----
  { id: "p_trellis", category: "supports", icon: "🕸️", unit: "each", price: 650,
    name: { en: "Trellis net 2 x 3 m", si: "වැල් දැල මී. 2 x 3", ta: "கொடி வலை 2 x 3 மீ" } },
  { id: "p_stake", category: "supports", icon: "🎋", unit: "pack", price: 300,
    name: { en: "Bamboo stakes (10)", si: "උණ කූරු (10)", ta: "மூங்கில் குச்சிகள் (10)" } },
  { id: "p_tie", category: "supports", icon: "🧵", unit: "pack", price: 150,
    name: { en: "Soft plant ties", si: "මෘදු පැළ බැඳුම්", ta: "மென்மையான செடி கட்டிகள்" } },
  { id: "p_shade", category: "supports", icon: "⛱️", unit: "each", price: 900,
    name: { en: "Shade net 2 x 2 m", si: "සෙවන දැල මී. 2 x 2", ta: "நிழல் வலை 2 x 2 மீ" } },

  // ---- Fertilizers and growing media ----
  { id: "f_compost", category: "fertilizers", icon: "🟫", unit: "bag", price: 650,
    name: { en: "Compost (10 kg bag)", si: "කොම්පෝස්ට් (කි.ග්‍රෑ. 10 බෑගය)", ta: "உரம் (10 கி.கி பை)" } },
  { id: "f_organic", category: "fertilizers", icon: "🌾", unit: "kg", price: 300,
    name: { en: "Organic fertilizer", si: "කාබනික පොහොර", ta: "இயற்கை உரம்" } },
  { id: "f_cocopeat", category: "fertilizers", icon: "🥥", unit: "block", price: 450,
    name: { en: "Coco peat block (5 kg)", si: "කොහු බත් කුට්ටිය (කි.ග්‍රෑ. 5)", ta: "தேங்காய் நார்க்கட்டி (5 கி.கி)" } },
  { id: "f_vermi", category: "fertilizers", icon: "🪱", unit: "bag", price: 700,
    name: { en: "Vermicompost (5 kg bag)", si: "ගැඩවිල් පොහොර (කි.ග්‍රෑ. 5)", ta: "மண்புழு உரம் (5 கி.கி பை)" } },
  { id: "f_bone", category: "fertilizers", icon: "🦴", unit: "kg", price: 400,
    name: { en: "Bone meal", si: "ඇට කුඩු", ta: "எலும்புத் தூள்" } },
  { id: "f_seaweed", category: "fertilizers", icon: "🌊", unit: "bottle", price: 750,
    name: { en: "Liquid seaweed feed (500 ml)", si: "මුහුදු පැලෑටි දියර පොහොර (මි.ලී. 500)", ta: "கடற்பாசி திரவ உரம் (500 மி.லி)" } },
  { id: "f_dolomite", category: "fertilizers", icon: "⚪", unit: "kg", price: 200,
    name: { en: "Dolomite lime", si: "ඩොලමයිට්", ta: "டோலமைட் சுண்ணாம்பு" } },

  // ---- Crop protection ----
  { id: "c_neem", category: "protection", icon: "🧴", unit: "bottle", price: 650,
    name: { en: "Neem oil (500 ml)", si: "කොහොඹ තෙල් (මි.ලී. 500)", ta: "வேப்ப எண்ணெய் (500 மி.லி)" } },
  { id: "c_trap", category: "protection", icon: "🟨", unit: "pack", price: 400,
    name: { en: "Yellow sticky traps (5)", si: "කහ ඇලෙන උගුල් (5)", ta: "மஞ்சள் ஒட்டும் பொறிகள் (5)" } },
  { id: "c_soap", category: "protection", icon: "🫧", unit: "bottle", price: 550,
    name: { en: "Insecticidal soap (500 ml)", si: "කෘමිනාශක සබන් (මි.ලී. 500)", ta: "பூச்சிக்கொல்லி சோப்பு (500 மி.லி)" } },
  { id: "c_fruitfly", category: "protection", icon: "🪰", unit: "each", price: 450,
    name: { en: "Fruit fly trap", si: "පලතුරු මැස්සන් උගුල", ta: "பழ ஈ பொறி" } },
  { id: "c_net", category: "protection", icon: "🥅", unit: "each", price: 800,
    name: { en: "Insect net 2 x 2 m", si: "කෘමි දැල මී. 2 x 2", ta: "பூச்சி வலை 2 x 2 மீ" } },

  // ---- Tools ----
  { id: "t_can", category: "tools", icon: "🚿", unit: "each", price: 750,
    name: { en: "Watering can 5 L", si: "වතුර දමන භාජනය ලී. 5", ta: "நீர் ஊற்றும் கேன் 5 லி" } },
  { id: "t_shears", category: "tools", icon: "✂️", unit: "each", price: 950,
    name: { en: "Pruning shears", si: "කප්පාදු කතුර", ta: "கத்தரிக்கோல்" } },
  { id: "t_trowel", category: "tools", icon: "🥄", unit: "each", price: 450,
    name: { en: "Hand trowel", si: "අත් හැන්ද", ta: "கை மண்வெட்டி" } },
  { id: "t_fork", category: "tools", icon: "🍴", unit: "each", price: 450,
    name: { en: "Hand fork", si: "අත් ගෑරුප්පුව", ta: "கை முட்கரண்டி" } },
  { id: "t_sprayer", category: "tools", icon: "💦", unit: "each", price: 650,
    name: { en: "Hand sprayer 1 L", si: "අත් ඉසින යන්ත්‍රය ලී. 1", ta: "கை தெளிப்பான் 1 லி" } },
  { id: "t_gloves", category: "tools", icon: "🧤", unit: "each", price: 350,
    name: { en: "Garden gloves", si: "උයන් අත්වැසුම්", ta: "தோட்டக் கையுறைகள்" } },
  { id: "t_ph", category: "tools", icon: "📟", unit: "each", price: 2500,
    name: { en: "Soil pH meter", si: "පස් pH මීටරය", ta: "மண் pH மீட்டர்" } },
];

/**
 * ==== SHARED SUPPLIES (SRS 4.3) ====
 * Added once to every grow plan's shopping list.
 */
export const SHARED_SUPPLIES: { productId: string; qty: number }[] = [
  { productId: "f_compost", qty: 1 },
  { productId: "f_organic", qty: 2 },
  { productId: "c_neem", qty: 1 },
  { productId: "t_can", qty: 1 },
  { productId: "t_shears", qty: 1 },
];

/**
 * ==== CONTAINER RULE (BR-15) AND TRELLIS (BR-16) ====
 */
export const CONTAINER_LARGE = "k_gb15"; // 2 sq ft or more per plant
export const CONTAINER_MEDIUM = "k_pot12"; // 1 to under 2 sq ft
export const CONTAINER_SMALL = "k_pot8"; // under 1 sq ft
export const TRELLIS = "p_trellis";
