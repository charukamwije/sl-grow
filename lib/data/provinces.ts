/**
 * ==== PROVINCES AND THEIR VEGETABLES (landing page map) ====
 *
 * The vegetables each province is commonly known for growing. This is a
 * general guide for inspiration, not official production statistics; have
 * it checked by an agronomist with the Department of Agriculture (OI-06).
 * Sinhala and Tamil need a translator's review (OI-05).
 */
import type { StringKey } from "../i18n/strings";
import type { Localized } from "../i18n/types";

export type Crop = { icon: string; name: Localized };

const CROP = {
  carrot: { icon: "🥕", name: { en: "Carrot", si: "කැරට්", ta: "கேரட்" } },
  leeks: { icon: "🧅", name: { en: "Leeks", si: "ලීක්ස්", ta: "லீக்ஸ்" } },
  cabbage: { icon: "🥬", name: { en: "Cabbage", si: "ගෝවා", ta: "கோவா" } },
  beans: { icon: "🫘", name: { en: "Beans", si: "බෝංචි", ta: "அவரை" } },
  potato: { icon: "🥔", name: { en: "Potato", si: "අර්තාපල්", ta: "உருளைக்கிழங்கு" } },
  beetroot: { icon: "🟣", name: { en: "Beetroot", si: "බීට්", ta: "பீட்ரூட்" } },
  bigOnion: { icon: "🧅", name: { en: "Big onion", si: "ලොකු ළූණු", ta: "பெரிய வெங்காயம்" } },
  redOnion: { icon: "🧅", name: { en: "Red onion", si: "රතු ළූණු", ta: "சின்ன வெங்காயம்" } },
  chili: { icon: "🌶️", name: { en: "Chili", si: "මිරිස්", ta: "மிளகாய்" } },
  brinjal: { icon: "🍆", name: { en: "Brinjal", si: "වම්බටු", ta: "கத்தரிக்காய்" } },
  okra: { icon: "🌿", name: { en: "Okra", si: "බණ්ඩක්කා", ta: "வெண்டைக்காய்" } },
  pumpkin: { icon: "🎃", name: { en: "Pumpkin", si: "වට්ටක්කා", ta: "பூசணி" } },
  longBean: { icon: "🫛", name: { en: "Long bean", si: "මෑ කරල්", ta: "பயிற்றங்காய்" } },
  cowpea: { icon: "🫘", name: { en: "Cowpea", si: "කව්පි", ta: "காராமணி" } },
  bitterGourd: { icon: "🥒", name: { en: "Bitter gourd", si: "කරවිල", ta: "பாகற்காய்" } },
  snakeGourd: { icon: "🐍", name: { en: "Snake gourd", si: "පතෝල", ta: "புடலங்காய்" } },
  cucumber: { icon: "🥒", name: { en: "Cucumber", si: "පිපිඤ්ඤා", ta: "வெள்ளரி" } },
  kankun: { icon: "🥬", name: { en: "Kankun", si: "කංකුං", ta: "வள்ளல் கீரை" } },
  gotukola: { icon: "🍀", name: { en: "Gotukola", si: "ගොටුකොළ", ta: "வல்லாரை" } },
  mukunuwenna: { icon: "🌱", name: { en: "Mukunuwenna", si: "මුකුණුවැන්න", ta: "பொன்னாங்கண்ணி" } },
  tomato: { icon: "🍅", name: { en: "Tomato", si: "තක්කාලි", ta: "தக்காளி" } },
  capsicum: { icon: "🫑", name: { en: "Capsicum", si: "මාළු මිරිස්", ta: "குடைமிளகாய்" } },
} satisfies Record<string, Crop>;

export type Province = {
  id: string;
  name: Localized;
  districts: Localized;
  /** The climate zones it spans, as described on the landing page */
  zones: StringKey[];
  crops: Crop[];
};

export const PROVINCES: Province[] = [
  {
    id: "northern",
    name: { en: "Northern", si: "උතුරු", ta: "வடக்கு" },
    districts: { en: "Jaffna, Kilinochchi, Mannar, Mullaitivu, Vavuniya", si: "යාපනය, කිලිනොච්චිය, මන්නාරම, මුලතිව්, වවුනියාව", ta: "யாழ்ப்பாணம், கிளிநொச்சி, மன்னார், முல்லைத்தீவு, வவுனியா" },
    zones: ["home.zoneDry"],
    crops: [CROP.redOnion, CROP.chili, CROP.brinjal, CROP.pumpkin, CROP.okra],
  },
  {
    id: "north-central",
    name: { en: "North Central", si: "උතුරු මැද", ta: "வட மத்திய" },
    districts: { en: "Anuradhapura, Polonnaruwa", si: "අනුරාධපුරය, පොළොන්නරුව", ta: "அனுராதபுரம், பொலன்னறுவை" },
    zones: ["home.zoneDry"],
    crops: [CROP.bigOnion, CROP.chili, CROP.pumpkin, CROP.cowpea, CROP.brinjal],
  },
  {
    id: "north-western",
    name: { en: "North Western", si: "වයඹ", ta: "வடமேல்" },
    districts: { en: "Kurunegala, Puttalam", si: "කුරුණෑගල, පුත්තලම", ta: "குருநாகல், புத்தளம்" },
    zones: ["home.zoneIntermediate", "home.zoneDry"],
    crops: [CROP.redOnion, CROP.chili, CROP.okra, CROP.brinjal, CROP.longBean],
  },
  {
    id: "eastern",
    name: { en: "Eastern", si: "නැගෙනහිර", ta: "கிழக்கு" },
    districts: { en: "Trincomalee, Batticaloa, Ampara", si: "ත්‍රිකුණාමලය, මඩකලපුව, අම්පාර", ta: "திருகோணமலை, மட்டக்களப்பு, அம்பாறை" },
    zones: ["home.zoneDry"],
    crops: [CROP.chili, CROP.pumpkin, CROP.brinjal, CROP.okra, CROP.cowpea],
  },
  {
    id: "central",
    name: { en: "Central", si: "මධ්‍යම", ta: "மத்திய" },
    districts: { en: "Kandy, Matale, Nuwara Eliya", si: "මහනුවර, මාතලේ, නුවරඑළිය", ta: "கண்டி, மாத்தளை, நுவரெலியா" },
    zones: ["home.zoneUp", "home.zoneIntermediate"],
    crops: [CROP.carrot, CROP.leeks, CROP.cabbage, CROP.potato, CROP.beans, CROP.tomato],
  },
  {
    id: "uva",
    name: { en: "Uva", si: "ඌව", ta: "ஊவா" },
    districts: { en: "Badulla, Monaragala", si: "බදුල්ල, මොණරාගල", ta: "பதுளை, மொனராகலை" },
    zones: ["home.zoneUp", "home.zoneIntermediate"],
    crops: [CROP.potato, CROP.beans, CROP.carrot, CROP.cabbage, CROP.beetroot],
  },
  {
    id: "western",
    name: { en: "Western", si: "බස්නාහිර", ta: "மேல்" },
    districts: { en: "Colombo, Gampaha, Kalutara", si: "කොළඹ, ගම්පහ, කළුතර", ta: "கொழும்பு, கம்பஹா, களுத்துறை" },
    zones: ["home.zoneWet"],
    crops: [CROP.kankun, CROP.gotukola, CROP.mukunuwenna, CROP.longBean, CROP.okra],
  },
  {
    id: "sabaragamuwa",
    name: { en: "Sabaragamuwa", si: "සබරගමුව", ta: "சப்ரகமுவ" },
    districts: { en: "Ratnapura, Kegalle", si: "රත්නපුරය, කෑගල්ල", ta: "இரத்தினபுரி, கேகாலை" },
    zones: ["home.zoneWet"],
    crops: [CROP.bitterGourd, CROP.snakeGourd, CROP.longBean, CROP.okra, CROP.gotukola],
  },
  {
    id: "southern",
    name: { en: "Southern", si: "දකුණු", ta: "தெற்கு" },
    districts: { en: "Galle, Matara, Hambantota", si: "ගාල්ල, මාතර, හම්බන්තොට", ta: "காலி, மாத்தறை, அம்பாந்தோட்டை" },
    zones: ["home.zoneWet", "home.zoneDry"],
    crops: [CROP.pumpkin, CROP.brinjal, CROP.snakeGourd, CROP.cucumber, CROP.chili],
  },
];
