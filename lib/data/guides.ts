/**
 * ==== GROW GUIDES (SRS 3.10, 4.4) ====
 *
 * `[[product_id]]` inside a step is shown as the product's name and code in
 * the reader's language (FR-G-06). Steps shared by many vegetables are
 * written once in STEP below. Growing advice needs an agronomist's review
 * (OI-06); Sinhala and Tamil need a translator's review (OI-05).
 */
import type { Localized } from "../i18n/types";

// `icon` is the step's picture, shown large so the step reads at a glance
export type GuideStep = { icon: string; title: Localized; text: Localized };

export type Guide = {
  id: string;
  kind: "package" | "soil" | "vegetable";
  icon: string;
  name: Localized;
  /** Package and soil only; vegetable guides show days to first harvest */
  time?: Localized;
  vegId?: string;
  steps: GuideStep[];
  products: string[];
};

/** One 15 L grow bag of potting mix, for the soil guide's "mix cost per bag" */
export const SOIL_MIX_PER_BAG: { productId: string; qty: number }[] = [
  { productId: "f_compost", qty: 0.4 },
  { productId: "f_cocopeat", qty: 0.3 },
  { productId: "f_organic", qty: 0.2 },
  { productId: "f_dolomite", qty: 0.05 },
];
export const SOIL_READY_DAYS = 14;
export const PACKAGE_READY_DAYS = 1;

const STEP = {
  prep: (container: string): GuideStep => ({
    icon: "🪴",
    title: { en: "Prepare the container", si: "බඳුන සූදානම් කරන්න", ta: "கொள்கலனைத் தயார் செய்யவும்" },
    text: {
      en: `Fill a [[${container}]] with the potting mix from the soil guide, leaving 3 cm at the top. Place it where it gets 5 to 6 hours of sun.`,
      si: `පස් මාර්ගෝපදේශයේ මිශ්‍රණයෙන් [[${container}]] පුරවන්න; ඉහළින් සෙ.මී. 3 ක් ඉතිරි කරන්න. පැය 5-6 ක හිරු එළිය ලැබෙන තැනක තබන්න.`,
      ta: `மண் வழிகாட்டியின் கலவையால் [[${container}]] ஐ நிரப்பவும்; மேலே 3 செ.மீ இடம் விடவும். 5-6 மணி நேர வெயில் படும் இடத்தில் வைக்கவும்.`,
    },
  }),
  harden: {
    icon: "⛅",
    title: { en: "Harden off", si: "හිරුට හුරු කරන්න", ta: "வெயிலுக்குப் பழக்கவும்" },
    text: {
      en: "Keep the seedlings in light shade for 3 days, then give them a little more sun each day for a week.",
      si: "පැළ දින 3 ක් සැහැල්ලු සෙවනේ තබා, ඉන්පසු සතියක් පුරා දිනපතා ටිකෙන් ටික හිරු එළිය වැඩි කරන්න.",
      ta: "நாற்றுகளை 3 நாட்கள் லேசான நிழலில் வைத்து, பின்னர் ஒரு வாரம் தினமும் சிறிது சிறிதாக வெயிலை அதிகரிக்கவும்.",
    },
  },
  plant: {
    icon: "🌱",
    title: { en: "Plant the seedling", si: "පැළය සිටුවන්න", ta: "நாற்றை நடவும்" },
    text: {
      en: "Plant in the evening at the same depth as in its tray, firm the soil gently and water well.",
      si: "සවස් කාලයේ, තැටියේ තිබූ ගැඹුරටම සිටුවා, පස මෘදුව තද කර හොඳින් වතුර දමන්න.",
      ta: "மாலையில், தட்டில் இருந்த அதே ஆழத்தில் நட்டு, மண்ணை மெதுவாக அழுத்தி நன்றாக நீர் ஊற்றவும்.",
    },
  },
  water: {
    icon: "💧",
    title: { en: "Water every day", si: "දිනපතා වතුර දමන්න", ta: "தினமும் நீர் ஊற்றவும்" },
    text: {
      en: "Water each morning at the base of the plant with a [[t_can]]. Keep the soil moist but not soggy; in hot weather water again in the evening.",
      si: "[[t_can]] භාවිතයෙන් සෑම උදෑසනකම පැළයේ මුලට වතුර දමන්න. පස තෙත්ව තබන්න, නමුත් වතුර පිරී නොසිටිය යුතුයි; උෂ්ණ කාලයේ සවසද වතුර දමන්න.",
      ta: "[[t_can]] மூலம் ஒவ்வொரு காலையும் செடியின் அடியில் நீர் ஊற்றவும். மண் ஈரமாக இருக்கட்டும், ஆனால் தேங்கக் கூடாது; வெப்பமான நாட்களில் மாலையிலும் ஊற்றவும்.",
    },
  },
  feed: {
    icon: "🌾",
    title: { en: "Feed", si: "පොහොර යොදන්න", ta: "உரமிடவும்" },
    text: {
      en: "From week 3, mix a handful of [[f_organic]] into the top soil every 2 weeks and water it in.",
      si: "3 වන සතියේ සිට, සති 2 කට වරක් [[f_organic]] අතලොස්සක් උඩු පසට මිශ්‍ර කර වතුර දමන්න.",
      ta: "3வது வாரத்திலிருந்து, 2 வாரங்களுக்கு ஒருமுறை ஒரு கைப்பிடி [[f_organic]] ஐ மேல் மண்ணில் கலந்து நீர் ஊற்றவும்.",
    },
  },
  pests: {
    icon: "🐛",
    title: { en: "Watch for pests", si: "පළිබෝධ පරීක්ෂා කරන්න", ta: "பூச்சிகளைக் கவனிக்கவும்" },
    text: {
      en: "Check under the leaves twice a week. If you see insects, spray diluted [[c_neem]] in the evening with a [[t_sprayer]].",
      si: "සතියකට දෙවරක් කොළ යට පරීක්ෂා කරන්න. කෘමීන් දුටුවහොත්, සවස් කාලයේ [[t_sprayer]] මගින් දියකළ [[c_neem]] ඉසින්න.",
      ta: "வாரத்திற்கு இருமுறை இலைகளின் அடியில் பாருங்கள். பூச்சிகள் இருந்தால், மாலையில் [[t_sprayer]] மூலம் நீர்த்த [[c_neem]] தெளிக்கவும்.",
    },
  },
  stake: {
    icon: "🎋",
    title: { en: "Stake the plant", si: "කූරක් සවි කරන්න", ta: "குச்சி நடவும்" },
    text: {
      en: "Push a [[p_stake]] beside the plant and tie the stem loosely with [[p_tie]] as it grows.",
      si: "පැළය අසල [[p_stake]] සිටුවා, වැඩෙන විට [[p_tie]] මගින් කඳ ලිහිල්ව බැඳින්න.",
      ta: "செடியின் அருகில் [[p_stake]] நட்டு, வளரும்போது [[p_tie]] கொண்டு தண்டை தளர்வாகக் கட்டவும்.",
    },
  },
  trellis: {
    icon: "🕸️",
    title: { en: "Give it a trellis", si: "වැල් දැලක් දෙන්න", ta: "கொடி வலை அமைக்கவும்" },
    text: {
      en: "Fix a [[p_trellis]] 1.5 to 2 m high on a wall or railing and guide the vines onto it as they grow.",
      si: "බිත්තියක හෝ වැටක මී. 1.5-2 උසට [[p_trellis]] සවි කර, වැල් වැඩෙන විට ඒ මතට යොමු කරන්න.",
      ta: "சுவர் அல்லது கம்பியில் 1.5-2 மீ உயரத்தில் [[p_trellis]] பொருத்தி, கொடிகள் வளரும்போது அதன் மேல் விடவும்.",
    },
  },
  pollinate: {
    icon: "🌼",
    title: { en: "Help pollination", si: "පරාගනයට උදව් කරන්න", ta: "மகரந்தச் சேர்க்கைக்கு உதவவும்" },
    text: {
      en: "If flowers drop without fruit, pick a male flower in the morning and touch its centre to the female flowers (the ones with a tiny fruit behind them).",
      si: "ගෙඩි නොහැදී මල් හැලෙනවා නම්, උදෑසන පිරිමි මලක් කඩා එහි මැද කොටස ගැහැණු මල්වල (පිටුපස කුඩා ගෙඩියක් ඇති) ස්පර්ශ කරන්න.",
      ta: "காய் இல்லாமல் பூக்கள் உதிர்ந்தால், காலையில் ஆண் பூவைப் பறித்து அதன் நடுப்பகுதியை பெண் பூக்களில் (பின்னால் சிறிய காய் உள்ளவை) தொடவும்.",
    },
  },
  fruitFly: {
    icon: "🪰",
    title: { en: "Protect from fruit flies", si: "පලතුරු මැස්සන්ගෙන් ආරක්ෂා කරන්න", ta: "பழ ஈக்களிலிருந்து பாதுகாக்கவும்" },
    text: {
      en: "Hang a [[c_fruitfly]] nearby, and cover young fruits with a paper bag tied at the top.",
      si: "අසලින් [[c_fruitfly]] එල්ලා, කුඩා ගෙඩි ඉහළින් බැඳි කඩදාසි බෑගයකින් ආවරණය කරන්න.",
      ta: "அருகில் [[c_fruitfly]] தொங்கவிட்டு, இளம் காய்களை மேலே கட்டிய காகிதப் பையால் மூடவும்.",
    },
  },
  cutAgain: {
    icon: "✂️",
    title: { en: "Cut and come again", si: "කපා නැවත වවන්න", ta: "வெட்டி மீண்டும் வளர்க்கவும்" },
    text: {
      en: "After each harvest, water and add a little [[f_organic]]. New shoots will be ready to cut again in 2 to 3 weeks.",
      si: "සෑම අස්වැන්නකටම පසු වතුර දමා [[f_organic]] ටිකක් යොදන්න. සති 2-3 කින් නැවත කැපීමට නව දළු සූදානම් වේ.",
      ta: "ஒவ்வொரு அறுவடைக்குப் பிறகும் நீர் ஊற்றி சிறிது [[f_organic]] இடவும். 2-3 வாரங்களில் புதிய தளிர்கள் மீண்டும் வெட்டத் தயாராகும்.",
    },
  },
} satisfies Record<string, GuideStep | ((container: string) => GuideStep)>;

function harvest(text: Localized): GuideStep {
  return {
    icon: "🧺",
    title: { en: "Harvest", si: "අස්වනු නෙළන්න", ta: "அறுவடை செய்யவும்" },
    text,
  };
}

const BASE_PRODUCTS = ["f_compost", "f_organic", "c_neem"];

export const GUIDES: Guide[] = [
  {
    id: "package",
    kind: "package",
    icon: "📦",
    name: { en: "Package arrival and setup", si: "පැකේජය ලැබීම සහ සැකසීම", ta: "பொதி வருகை மற்றும் அமைப்பு" },
    time: { en: "1 day", si: "දින 1", ta: "1 நாள்" },
    products: ["f_compost", "f_organic", "c_neem", "t_can", "t_shears", "t_gloves"],
    steps: [
      {
        icon: "📦",
        title: { en: "Open the box at once", si: "වහාම පෙට්ටිය විවෘත කරන්න", ta: "உடனே பெட்டியைத் திறக்கவும்" },
        text: { en: "Open the package as soon as it arrives and take the seedlings out so they get air and light.", si: "පැකේජය ලැබුණු වහාම විවෘත කර පැළවලට වාතය සහ ආලෝකය ලැබෙන ලෙස එළියට ගන්න.", ta: "பொதி வந்தவுடன் திறந்து, நாற்றுகளுக்குக் காற்றும் ஒளியும் கிடைக்க வெளியே எடுக்கவும்." },
      },
      {
        icon: "✅",
        title: { en: "Check your order", si: "ඔබේ ඇණවුම පරීක්ෂා කරන්න", ta: "உங்கள் ஆர்டரைச் சரிபார்க்கவும்" },
        text: { en: "Compare the items with your WhatsApp order using the product codes. Message the shop the same day if anything is missing or damaged.", si: "නිෂ්පාදන කේත භාවිතයෙන් භාණ්ඩ ඔබේ WhatsApp ඇණවුම සමඟ සසඳන්න. යමක් අඩු හෝ හානි වී ඇත්නම් එදිනම සාප්පුවට පණිවිඩයක් යවන්න.", ta: "பொருள் குறியீடுகளைக் கொண்டு உங்கள் WhatsApp ஆர்டருடன் ஒப்பிடவும். ஏதாவது குறைவாகவோ சேதமாகவோ இருந்தால் அன்றே கடைக்குச் செய்தி அனுப்பவும்." },
      },
      {
        icon: "💧",
        title: { en: "Water the seedlings", si: "පැළවලට වතුර දමන්න", ta: "நாற்றுகளுக்கு நீர் ஊற்றவும்" },
        text: { en: "Give the seedlings a gentle drink and keep them in light shade. Do not plant them in strong midday sun.", si: "පැළවලට මෘදුව වතුර දී සැහැල්ලු සෙවනේ තබන්න. දහවල් තද අව්වේ සිටුවන්න එපා.", ta: "நாற்றுகளுக்கு மெதுவாக நீர் ஊற்றி லேசான நிழலில் வைக்கவும். நண்பகல் கடும் வெயிலில் நட வேண்டாம்." },
      },
      {
        icon: "☀️",
        title: { en: "Choose the spot", si: "ස්ථානය තෝරන්න", ta: "இடத்தைத் தேர்ந்தெடுக்கவும்" },
        text: { en: "Pick the place with the most sun, 5 to 6 hours a day, close to a water tap and safe from strong wind.", si: "දිනකට පැය 5-6 ක හිරු එළිය ලැබෙන, ජල කරාමයට ආසන්න, තද සුළඟින් ආරක්ෂිත ස්ථානය තෝරන්න.", ta: "நாளொன்றுக்கு 5-6 மணி நேர வெயில் படும், நீர்க் குழாய்க்கு அருகில், கடும் காற்றிலிருந்து பாதுகாப்பான இடத்தைத் தேர்ந்தெடுக்கவும்." },
      },
      {
        icon: "🪴",
        title: { en: "Set out the containers", si: "බඳුන් සකසන්න", ta: "கொள்கலன்களை வைக்கவும்" },
        text: { en: "Put the grow bags and pots in place before filling them, tall plants and climbers at the back, small ones in front.", si: "පිරවීමට පෙර වගා බෑග් සහ බඳුන් තැබිය යුතු තැන්වල තබන්න; උස පැළ සහ වැල් පිටුපසින්, කුඩා ඒවා ඉදිරියෙන්.", ta: "நிரப்புவதற்கு முன் பைகளையும் தொட்டிகளையும் இடத்தில் வைக்கவும்; உயரமான செடிகளும் கொடிகளும் பின்னால், சிறியவை முன்னால்." },
      },
      {
        icon: "🟤",
        title: { en: "Mix the soil", si: "පස මිශ්‍ර කරන්න", ta: "மண்ணைக் கலக்கவும்" },
        text: { en: "Follow the soil preparation guide to make the potting mix with [[f_compost]] and fill the containers.", si: "[[f_compost]] සමඟ පස් මිශ්‍රණය සෑදීමට පස් සකස් කිරීමේ මාර්ගෝපදේශය අනුගමනය කර බඳුන් පුරවන්න.", ta: "[[f_compost]] கொண்டு கலவை தயாரிக்க மண் தயாரிப்பு வழிகாட்டியைப் பின்பற்றி கொள்கலன்களை நிரப்பவும்." },
      },
      {
        icon: "🌱",
        title: { en: "Plant and follow each guide", si: "සිටුවා එක් එක් මාර්ගෝපදේශය අනුගමනය කරන්න", ta: "நட்டு ஒவ்வொரு வழிகாட்டியையும் பின்பற்றவும்" },
        text: { en: "Plant the seedlings in the evening within 2 days, then open the guide for each vegetable and follow its steps.", si: "දින 2 ක් ඇතුළත සවස් කාලයේ පැළ සිටුවා, එක් එක් එළවළුවේ මාර්ගෝපදේශය විවෘත කර එහි පියවර අනුගමනය කරන්න.", ta: "2 நாட்களுக்குள் மாலையில் நாற்றுகளை நட்டு, ஒவ்வொரு காய்கறியின் வழிகாட்டியையும் திறந்து அதன் படிகளைப் பின்பற்றவும்." },
      },
    ],
  },
  {
    id: "soil",
    kind: "soil",
    icon: "🟤",
    name: { en: "Soil preparation", si: "පස් සකස් කිරීම", ta: "மண் தயாரிப்பு" },
    time: { en: "2 weeks", si: "සති 2", ta: "2 வாரங்கள்" },
    products: ["f_compost", "f_cocopeat", "f_organic", "f_dolomite", "f_vermi", "t_ph", "t_trowel", "t_gloves"],
    steps: [
      {
        icon: "🧰",
        title: { en: "Gather the materials", si: "ද්‍රව්‍ය එකතු කරන්න", ta: "பொருட்களைச் சேகரிக்கவும்" },
        text: { en: "You need [[f_compost]], [[f_cocopeat]], garden soil, [[f_organic]] and [[f_dolomite]].", si: "ඔබට [[f_compost]], [[f_cocopeat]], ගෙවතු පස, [[f_organic]] සහ [[f_dolomite]] අවශ්‍යයි.", ta: "உங்களுக்கு [[f_compost]], [[f_cocopeat]], தோட்ட மண், [[f_organic]], [[f_dolomite]] தேவை." },
      },
      {
        icon: "🥥",
        title: { en: "Soak the coco peat", si: "කොහු බත් පොඟවන්න", ta: "தேங்காய் நாரை ஊறவைக்கவும்" },
        text: { en: "Soak the coco peat block in a bucket of water for a few hours until it breaks apart. Squeeze out extra water.", si: "කොහු බත් කුට්ටිය කැඩී යන තෙක් පැය කිහිපයක් බාල්දියක වතුරේ පොඟවන්න. අමතර වතුර මිරිකා ඉවත් කරන්න.", ta: "தேங்காய் நார்க் கட்டி உதிரும் வரை சில மணி நேரம் வாளி நீரில் ஊறவைக்கவும். அதிகப்படியான நீரைப் பிழிந்து விடவும்." },
      },
      {
        icon: "🚿",
        title: { en: "Wash it once", si: "එක් වරක් සෝදන්න", ta: "ஒருமுறை கழுவவும்" },
        text: { en: "Rinse the soaked coco peat once with fresh water to remove salt.", si: "ලුණු ඉවත් කිරීමට පොඟවූ කොහු බත් එක් වරක් නැවුම් වතුරෙන් සෝදන්න.", ta: "உப்பை நீக்க ஊறிய தேங்காய் நாரை ஒருமுறை நன்னீரில் அலசவும்." },
      },
      {
        icon: "🪣",
        title: { en: "Sieve the garden soil", si: "ගෙවතු පස පෙරන්න", ta: "தோட்ட மண்ணைச் சலிக்கவும்" },
        text: { en: "Remove stones, roots and weeds from the garden soil.", si: "ගෙවතු පසෙන් ගල්, මුල් සහ වල් පැළ ඉවත් කරන්න.", ta: "தோட்ட மண்ணிலிருந்து கற்கள், வேர்கள், களைகளை அகற்றவும்." },
      },
      {
        icon: "🥣",
        title: { en: "Mix in equal parts", si: "සමාන කොටස් මිශ්‍ර කරන්න", ta: "சம அளவில் கலக்கவும்" },
        text: { en: "Mix one part soil, one part compost and one part coco peat with a [[t_trowel]] until even.", si: "පස් කොටසක්, කොම්පෝස්ට් කොටසක් සහ කොහු බත් කොටසක් [[t_trowel]] මගින් ඒකාකාර වන තෙක් මිශ්‍ර කරන්න.", ta: "ஒரு பங்கு மண், ஒரு பங்கு உரம், ஒரு பங்கு தேங்காய் நார் ஆகியவற்றை [[t_trowel]] கொண்டு சீராகக் கலக்கவும்." },
      },
      {
        icon: "🌾",
        title: { en: "Add fertilizer and lime", si: "පොහොර සහ හුණු එක් කරන්න", ta: "உரமும் சுண்ணாம்பும் சேர்க்கவும்" },
        text: { en: "For each 15 L bag of mix, add 2 handfuls of organic fertilizer and 1 tablespoon of dolomite.", si: "මිශ්‍රණයේ සෑම ලීටර් 15 බෑගයකටම කාබනික පොහොර අතලොස්සක් දෙකක් සහ ඩොලමයිට් මේස හැඳි එකක් එක් කරන්න.", ta: "ஒவ்வொரு 15 லி கலவைக்கும் 2 கைப்பிடி இயற்கை உரமும் 1 மேசைக்கரண்டி டோலமைட்டும் சேர்க்கவும்." },
      },
      {
        icon: "📟",
        title: { en: "Check the pH", si: "pH පරීක්ෂා කරන්න", ta: "pH ஐச் சரிபார்க்கவும்" },
        text: { en: "Moisten the mix and test it with a [[t_ph]]. Most vegetables like pH 6 to 7. Add a little more dolomite if it is below 6.", si: "මිශ්‍රණය තෙත් කර [[t_ph]] මගින් පරීක්ෂා කරන්න. බොහෝ එළවළුවලට pH 6-7 සුදුසුයි. 6 ට අඩු නම් තව ඩොලමයිට් ටිකක් එක් කරන්න.", ta: "கலவையை ஈரமாக்கி [[t_ph]] கொண்டு சோதிக்கவும். பெரும்பாலான காய்கறிகளுக்கு pH 6-7 ஏற்றது. 6க்குக் குறைவாக இருந்தால் சிறிது டோலமைட் சேர்க்கவும்." },
      },
      {
        icon: "🪴",
        title: { en: "Fill the containers", si: "බඳුන් පුරවන්න", ta: "கொள்கலன்களை நிரப்பவும்" },
        text: { en: "Fill the grow bags and pots, leaving 3 cm at the top. Make sure every container has drainage holes.", si: "ඉහළින් සෙ.මී. 3 ක් ඉතිරි කර වගා බෑග් සහ බඳුන් පුරවන්න. සෑම බඳුනකටම ජලය බැස යන සිදුරු ඇති බව තහවුරු කරන්න.", ta: "மேலே 3 செ.மீ இடம் விட்டு பைகளையும் தொட்டிகளையும் நிரப்பவும். ஒவ்வொன்றிலும் நீர் வடியும் துளைகள் உள்ளதா எனப் பார்க்கவும்." },
      },
      {
        icon: "⏳",
        title: { en: "Water and rest", si: "වතුර දමා තබන්න", ta: "நீர் ஊற்றி ஓய்வு விடவும்" },
        text: { en: "Water the mix well and let it rest for about 2 weeks so the compost settles. Keep it moist.", si: "මිශ්‍රණයට හොඳින් වතුර දමා කොම්පෝස්ට් සැකසීමට සති 2 ක් පමණ තබන්න. තෙත්ව තබා ගන්න.", ta: "கலவைக்கு நன்றாக நீர் ஊற்றி, உரம் படிய சுமார் 2 வாரங்கள் விடவும். ஈரமாக வைத்திருக்கவும்." },
      },
      {
        icon: "🔁",
        title: { en: "Top up each season", si: "සෑම වාරයකම එක් කරන්න", ta: "ஒவ்வொரு பருவத்திலும் நிரப்பவும்" },
        text: { en: "After each crop, loosen the soil and mix in fresh compost or [[f_vermi]] before planting again.", si: "සෑම වගාවකටම පසු පස බුරුල් කර, නැවත සිටුවීමට පෙර නැවුම් කොම්පෝස්ට් හෝ [[f_vermi]] මිශ්‍ර කරන්න.", ta: "ஒவ்வொரு பயிருக்குப் பிறகும் மண்ணைத் தளர்த்தி, மீண்டும் நடுவதற்கு முன் புதிய உரம் அல்லது [[f_vermi]] கலக்கவும்." },
      },
    ],
  },
  {
    id: "tomato",
    kind: "vegetable",
    vegId: "tomato",
    icon: "🍅",
    name: { en: "Tomato", si: "තක්කාලි", ta: "தக்காளி" },
    products: ["s_tomato", "k_gb15", "p_stake", "p_tie", ...BASE_PRODUCTS, "c_fruitfly"],
    steps: [
      STEP.prep("k_gb15"),
      STEP.harden,
      STEP.plant,
      STEP.stake,
      STEP.water,
      {
        icon: "🤏",
        title: { en: "Pinch side shoots", si: "අතු දළු කඩන්න", ta: "பக்கக் கிளைகளைக் கிள்ளவும்" },
        text: { en: "Pinch off the small shoots that grow between the main stem and the leaves, so the plant puts its energy into fruit.", si: "ප්‍රධාන කඳ සහ කොළ අතර වැඩෙන කුඩා දළු කඩා දමන්න; එවිට පැළය ගෙඩි සඳහා ශක්තිය යොදයි.", ta: "முக்கியத் தண்டுக்கும் இலைகளுக்கும் இடையே வளரும் சிறிய தளிர்களைக் கிள்ளவும்; செடி தன் ஆற்றலைக் காய்களுக்குச் செலவிடும்." },
      },
      STEP.feed,
      STEP.pests,
      harvest({ en: "Pick tomatoes when they turn fully red, every 2 to 3 days. The first fruit comes about 75 days after planting.", si: "සම්පූර්ණයෙන් රතු වූ විට දින 2-3 කට වරක් තක්කාලි නෙළන්න. සිටුවා දින 75 කින් පමණ පළමු ගෙඩි ලැබේ.", ta: "முழுமையாகச் சிவந்ததும் 2-3 நாட்களுக்கு ஒருமுறை பறிக்கவும். நட்டு சுமார் 75 நாட்களில் முதல் காய் வரும்." }),
    ],
  },
  {
    id: "chili",
    kind: "vegetable",
    vegId: "chili",
    icon: "🌶️",
    name: { en: "Green chili", si: "අමු මිරිස්", ta: "பச்சை மிளகாய்" },
    products: ["s_chili", "k_pot12", "p_stake", ...BASE_PRODUCTS, "c_trap"],
    steps: [
      STEP.prep("k_pot12"),
      STEP.harden,
      STEP.plant,
      STEP.water,
      STEP.feed,
      STEP.stake,
      STEP.pests,
      harvest({ en: "Pick the chilies green when they are firm and full size. Regular picking makes the plant flower more.", si: "තද සහ සම්පූර්ණ ප්‍රමාණයට පැමිණි විට කොළ පැහැයෙන්ම මිරිස් නෙළන්න. නිතර නෙළීමෙන් පැළය වැඩිපුර මල් පිපේ.", ta: "உறுதியாகவும் முழு அளவிலும் இருக்கும்போது பச்சையாகவே பறிக்கவும். அடிக்கடி பறித்தால் செடி அதிகம் பூக்கும்." }),
    ],
  },
  {
    id: "brinjal",
    kind: "vegetable",
    vegId: "brinjal",
    icon: "🍆",
    name: { en: "Brinjal", si: "වම්බටු", ta: "கத்தரிக்காய்" },
    products: ["s_brinjal", "k_gb15", "p_stake", "p_tie", ...BASE_PRODUCTS],
    steps: [
      STEP.prep("k_gb15"),
      STEP.harden,
      STEP.plant,
      STEP.stake,
      STEP.water,
      STEP.feed,
      STEP.pests,
      {
        icon: "✂️",
        title: { en: "Remove wilting shoots", si: "මැලවෙන දළු ඉවත් කරන්න", ta: "வாடும் தளிர்களை அகற்றவும்" },
        text: { en: "If a shoot tip wilts suddenly, a borer is inside. Cut it off below the damage with [[t_shears]] and destroy it.", si: "දළු අග හදිසියේ මැලවේ නම්, ඇතුළේ විදින පණුවෙක් සිටී. [[t_shears]] මගින් හානියට පහළින් කපා විනාශ කරන්න.", ta: "தளிர் நுனி திடீரென வாடினால் உள்ளே துளைப்பான் இருக்கிறது. [[t_shears]] கொண்டு சேதத்திற்குக் கீழே வெட்டி அழிக்கவும்." },
      },
      harvest({ en: "Cut the fruits with a short stalk while the skin is still shiny, about 70 days after planting.", si: "සිටුවා දින 70 කින් පමණ, සම තවම දිලිසෙන විට කෙටි නටුවක් සමඟ ගෙඩි කපන්න.", ta: "நட்டு சுமார் 70 நாட்களில், தோல் பளபளப்பாக இருக்கும்போதே சிறு காம்புடன் காய்களை வெட்டவும்." }),
    ],
  },
  {
    id: "okra",
    kind: "vegetable",
    vegId: "okra",
    icon: "🌿",
    name: { en: "Okra", si: "බණ්ඩක්කා", ta: "வெண்டைக்காய்" },
    products: ["s_okra", "k_pot12", ...BASE_PRODUCTS],
    steps: [
      STEP.prep("k_pot12"),
      STEP.plant,
      STEP.water,
      STEP.feed,
      STEP.pests,
      harvest({ en: "Pick pods when they are 7 to 10 cm long and still tender, about 50 days after planting.", si: "සිටුවා දින 50 කින් පමණ, කරල් සෙ.මී. 7-10 ක් දිග සහ තවම මෘදු විට නෙළන්න.", ta: "நட்டு சுமார் 50 நாட்களில், காய்கள் 7-10 செ.மீ நீளமும் இளசாகவும் இருக்கும்போது பறிக்கவும்." }),
      {
        icon: "🔁",
        title: { en: "Keep picking", si: "නොකඩවා නෙළන්න", ta: "தொடர்ந்து பறிக்கவும்" },
        text: { en: "Pick every 2 days. Pods left on the plant become hard and the plant stops producing.", si: "දින 2 කට වරක් නෙළන්න. පැළයේ ඉතිරි වන කරල් තද වී පැළය ඵලදාව නවත්වයි.", ta: "2 நாட்களுக்கு ஒருமுறை பறிக்கவும். செடியில் விடப்படும் காய்கள் கடினமாகி, செடி காய்ப்பதை நிறுத்தும்." },
      },
    ],
  },
  {
    id: "longbean",
    kind: "vegetable",
    vegId: "longbean",
    icon: "🫛",
    name: { en: "Long bean", si: "මෑ කරල්", ta: "பயிற்றங்காய்" },
    products: ["s_longbean", "k_pot12", "p_trellis", ...BASE_PRODUCTS],
    steps: [
      STEP.prep("k_pot12"),
      STEP.plant,
      STEP.trellis,
      STEP.water,
      STEP.feed,
      STEP.pests,
      harvest({ en: "Pick the beans when they are as thick as a pencil, before the seeds bulge, from about 60 days.", si: "දින 60 පමණ සිට, බීජ ඉදිමීමට පෙර පැන්සලක ඝනකමට ආ විට මෑ කරල් නෙළන්න.", ta: "சுமார் 60 நாட்களிலிருந்து, விதைகள் புடைக்கும் முன், பென்சில் தடிமனில் இருக்கும்போது பறிக்கவும்." }),
    ],
  },
  {
    id: "bittergourd",
    kind: "vegetable",
    vegId: "bittergourd",
    icon: "🥒",
    name: { en: "Bitter gourd", si: "කරවිල", ta: "பாகற்காய்" },
    products: ["s_bittergourd", "k_gb15", "p_trellis", ...BASE_PRODUCTS, "c_fruitfly"],
    steps: [
      STEP.prep("k_gb15"),
      STEP.harden,
      STEP.plant,
      STEP.trellis,
      STEP.water,
      STEP.feed,
      STEP.pollinate,
      STEP.fruitFly,
      harvest({ en: "Pick the fruits while green and firm, before they turn yellow, from about 65 days.", si: "දින 65 පමණ සිට, කහ පැහැ වීමට පෙර, කොළ පැහැයෙන් තද විට ගෙඩි නෙළන්න.", ta: "சுமார் 65 நாட்களிலிருந்து, மஞ்சளாகும் முன், பச்சையாகவும் உறுதியாகவும் இருக்கும்போது பறிக்கவும்." }),
    ],
  },
  {
    id: "snakegourd",
    kind: "vegetable",
    vegId: "snakegourd",
    icon: "🐍",
    name: { en: "Snake gourd", si: "පතෝල", ta: "புடலங்காய்" },
    products: ["s_snakegourd", "k_gb15", "p_trellis", ...BASE_PRODUCTS],
    steps: [
      STEP.prep("k_gb15"),
      STEP.plant,
      STEP.trellis,
      STEP.water,
      STEP.feed,
      STEP.pollinate,
      {
        icon: "🪨",
        title: { en: "Grow them straight", si: "කෙළින් වැඩෙන්නට සලස්වන්න", ta: "நேராக வளரச் செய்யவும்" },
        text: { en: "Tie a small stone to the tip of each young fruit with string so it hangs and grows straight.", si: "කුඩා ගෙඩිවල අගට නූලකින් කුඩා ගලක් බැඳ, එල්ලී කෙළින් වැඩෙන්නට සලස්වන්න.", ta: "ஒவ்வொரு இளம் காயின் நுனியிலும் நூலால் சிறிய கல்லைக் கட்டினால் தொங்கி நேராக வளரும்." },
      },
      harvest({ en: "Cut the fruits while young and tender, about 70 days after planting.", si: "සිටුවා දින 70 කින් පමණ, ළපටි සහ මෘදු විට ගෙඩි කපන්න.", ta: "நட்டு சுமார் 70 நாட்களில், இளசாகவும் மென்மையாகவும் இருக்கும்போது வெட்டவும்." }),
    ],
  },
  {
    id: "cucumber",
    kind: "vegetable",
    vegId: "cucumber",
    icon: "🥒",
    name: { en: "Cucumber", si: "පිපිඤ්ඤා", ta: "வெள்ளரிக்காய்" },
    products: ["s_cucumber", "k_gb15", "p_trellis", ...BASE_PRODUCTS],
    steps: [
      STEP.prep("k_gb15"),
      STEP.plant,
      STEP.trellis,
      STEP.water,
      STEP.feed,
      STEP.pests,
      STEP.pollinate,
      harvest({ en: "Pick cucumbers when firm and green, about 50 days after planting. Do not let them turn yellow.", si: "සිටුවා දින 50 කින් පමණ, තද සහ කොළ පැහැයෙන් ඇති විට නෙළන්න. කහ වීමට ඉඩ නොදෙන්න.", ta: "நட்டு சுமார் 50 நாட்களில், உறுதியாகவும் பச்சையாகவும் இருக்கும்போது பறிக்கவும். மஞ்சளாக விட வேண்டாம்." }),
    ],
  },
  {
    id: "capsicum",
    kind: "vegetable",
    vegId: "capsicum",
    icon: "🫑",
    name: { en: "Capsicum", si: "මාළු මිරිස්", ta: "குடைமிளகாய்" },
    products: ["s_capsicum", "k_pot12", "p_stake", "p_shade", ...BASE_PRODUCTS],
    steps: [
      STEP.prep("k_pot12"),
      STEP.harden,
      STEP.plant,
      STEP.stake,
      STEP.water,
      STEP.feed,
      STEP.pests,
      harvest({ en: "Cut the fruits when full size and glossy, about 80 days after planting. In very hot areas a [[p_shade]] helps.", si: "සිටුවා දින 80 කින් පමණ, සම්පූර්ණ ප්‍රමාණයට පැමිණ දිලිසෙන විට ගෙඩි කපන්න. ඉතා උණුසුම් ප්‍රදේශවල [[p_shade]] උපකාරී වේ.", ta: "நட்டு சுமார் 80 நாட்களில், முழு அளவிலும் பளபளப்பாகவும் இருக்கும்போது வெட்டவும். மிக வெப்பமான பகுதிகளில் [[p_shade]] உதவும்." }),
    ],
  },
  {
    id: "kankun",
    kind: "vegetable",
    vegId: "kankun",
    icon: "🥬",
    name: { en: "Kankun", si: "කංකුං", ta: "வள்ளல் கீரை" },
    products: ["s_kankun", "k_pot8", "f_compost", "f_organic"],
    steps: [
      STEP.prep("k_pot8"),
      STEP.plant,
      {
        icon: "💦",
        title: { en: "Keep it very wet", si: "ඉතා තෙත්ව තබන්න", ta: "மிக ஈரமாக வைக்கவும்" },
        text: { en: "Kankun loves water. Keep the soil wet at all times; a saucer of water under the pot helps.", si: "කංකුංවලට වතුරට කැමතියි. පස නිතරම තෙත්ව තබන්න; බඳුනට යටින් වතුර පීරිසියක් තැබීම උපකාරී වේ.", ta: "வள்ளல் கீரைக்கு நீர் பிடிக்கும். மண்ணை எப்போதும் ஈரமாக வைக்கவும்; தொட்டியின் கீழ் நீர்த் தட்டு உதவும்." },
      },
      STEP.feed,
      harvest({ en: "Cut the shoots 10 cm above the soil when they are about 25 cm tall, from about 30 days.", si: "දින 30 පමණ සිට, දළු සෙ.මී. 25 ක් පමණ උස වූ විට පසට සෙ.මී. 10 ක් ඉහළින් කපන්න.", ta: "சுமார் 30 நாட்களிலிருந்து, தளிர்கள் 25 செ.மீ உயரமானதும் மண்ணுக்கு 10 செ.மீ மேலே வெட்டவும்." }),
      STEP.cutAgain,
    ],
  },
  {
    id: "gotukola",
    kind: "vegetable",
    vegId: "gotukola",
    icon: "🍀",
    name: { en: "Gotukola", si: "ගොටුකොළ", ta: "வல்லாரை" },
    products: ["s_gotukola", "k_pot8", "f_compost", "f_organic"],
    steps: [
      STEP.prep("k_pot8"),
      STEP.plant,
      STEP.water,
      STEP.feed,
      harvest({ en: "Pick the larger leaves with their stalks from about 45 days, leaving the small ones to grow.", si: "දින 45 පමණ සිට විශාල කොළ නටු සමඟ නෙළන්න; කුඩා කොළ වැඩීමට තබන්න.", ta: "சுமார் 45 நாட்களிலிருந்து பெரிய இலைகளைக் காம்புடன் பறிக்கவும்; சிறியவை வளரட்டும்." }),
      {
        icon: "🌿",
        title: { en: "Let it spread", si: "පැතිරෙන්නට ඉඩ දෙන්න", ta: "பரவ விடவும்" },
        text: { en: "Gotukola spreads by runners. Press runners onto fresh pots of soil to start new plants for free.", si: "ගොටුකොළ ධාවක මගින් පැතිරේ. නව පැළ නොමිලේ ලබා ගැනීමට ධාවක නැවුම් පස් බඳුන් මත තද කරන්න.", ta: "வல்லாரை ஓடுகொடிகள் மூலம் பரவும். புதிய மண் தொட்டிகளில் ஓடுகொடிகளை அழுத்தி இலவசமாகப் புதிய செடிகளைப் பெறலாம்." },
      },
    ],
  },
];

export function getGuide(id: string): Guide | undefined {
  return GUIDES.find((guide) => guide.id === id);
}

export function guideForVeg(vegId: string): Guide | undefined {
  return GUIDES.find((guide) => guide.vegId === vegId);
}
