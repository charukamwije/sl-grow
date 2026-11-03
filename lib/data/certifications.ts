/**
 * ==== ASWEDDUMA CERTIFIED (the Join page) ====
 *
 * Each path is Learn (lessons and a knowledge check), Apply (practical
 * requirements and an application on WhatsApp), then Certified (a digital
 * badge issued by the Aswedduma team after review). This is Aswedduma's own
 * programme, not a government certificate. Lessons and questions need an
 * agronomist's review (OI-06); Sinhala and Tamil a translator's (OI-05).
 */
import type { Localized } from "../i18n/types";

export type Lesson = { title: Localized; text: Localized; href?: string };

export type Question = {
  question: Localized;
  options: Localized[];
  /** Index of the correct option */
  answer: number;
};

export type CertTrack = {
  id: "home-grower" | "seeds" | "plantation";
  icon: string;
  /** Short name on the badge itself, kept in English like a logo */
  badgeLabel: string;
  /** Badge colours: [light, dark] */
  colors: [string, string];
  name: Localized;
  forWho: Localized;
  lessons: Lesson[];
  requirements: Localized[];
  quiz: Question[];
};

export const CERT_TRACKS: CertTrack[] = [
  {
    id: "home-grower",
    icon: "🏡",
    badgeLabel: "HOME GROWER",
    colors: ["#34d399", "#047857"],
    name: { en: "Aswedduma Certified Home Grower", si: "අස්වැද්දුම සහතික ගෙවතු වගාකරු", ta: "அஸ்வெத்தும சான்றளிக்கப்பட்ட வீட்டுத் தோட்டக்காரர்" },
    forWho: { en: "Families growing vegetables at home, on a balcony or rooftop.", si: "ගෙදර, බැල්කනියේ හෝ වහලය මත එළවළු වවන පවුල්.", ta: "வீட்டில், பால்கனியில் அல்லது மொட்டை மாடியில் காய்கறி வளர்க்கும் குடும்பங்கள்." },
    lessons: [
      {
        title: { en: "Prepare good soil", si: "හොඳ පසක් සකස් කරන්න", ta: "நல்ல மண்ணைத் தயாரிக்கவும்" },
        text: { en: "Mix soil, compost and coco peat, check the pH and let the mix rest before planting.", si: "පස, කොම්පෝස්ට් සහ කොහු බත් මිශ්‍ර කර, pH පරීක්ෂා කර, සිටුවීමට පෙර මිශ්‍රණය තබන්න.", ta: "மண், உரம், தேங்காய் நார் கலந்து, pH சரிபார்த்து, நடுவதற்கு முன் கலவையை ஓய்வெடுக்க விடவும்." },
        href: "/guides/soil",
      },
      {
        title: { en: "Grow three vegetables well", si: "එළවළු තුනක් හොඳින් වවන්න", ta: "மூன்று காய்கறிகளை நன்றாக வளர்க்கவும்" },
        text: { en: "Follow a grow guide from planting to harvest: hardening off, watering, feeding and pest checks.", si: "සිටුවීමේ සිට අස්වැන්න දක්වා වගා මාර්ගෝපදේශයක් අනුගමනය කරන්න: හිරුට හුරු කිරීම, වතුර, පොහොර සහ පළිබෝධ පරීක්ෂාව.", ta: "நடவு முதல் அறுவடை வரை வழிகாட்டியைப் பின்பற்றவும்: வெயிலுக்குப் பழக்குதல், நீர், உரம், பூச்சிக் கண்காணிப்பு." },
        href: "/guides",
      },
      {
        title: { en: "Plan for your space", si: "ඔබේ ඉඩට සැලසුම් කරන්න", ta: "உங்கள் இடத்திற்குத் திட்டமிடுங்கள்" },
        text: { en: "Use the planner to choose what to grow for your household and space.", si: "ඔබේ පවුලට සහ ඉඩට වවන දේ තෝරා ගැනීමට සැලසුම්කරු භාවිතා කරන්න.", ta: "உங்கள் குடும்பத்திற்கும் இடத்திற்கும் என்ன வளர்ப்பது என்று தேர்வு செய்ய திட்டமிடலைப் பயன்படுத்துங்கள்." },
        href: "/planner",
      },
    ],
    requirements: [
      { en: "Grow at least three vegetables through one full season.", si: "අවම වශයෙන් එළවළු තුනක් එක් සම්පූර්ණ කන්නයක් පුරා වවන්න.", ta: "குறைந்தது மூன்று காய்கறிகளை ஒரு முழுப் பருவம் வளர்க்கவும்." },
      { en: "Share photos of your garden at planting and at harvest.", si: "සිටුවීමේදී සහ අස්වැන්නේදී ඔබේ ගෙවත්තේ ඡායාරූප බෙදාගන්න.", ta: "நடவின்போதும் அறுவடையின்போதும் உங்கள் தோட்டத்தின் படங்களைப் பகிருங்கள்." },
      { en: "Keep a simple record of what you harvested.", si: "ඔබ නෙළූ දේ පිළිබඳ සරල වාර්තාවක් තබා ගන්න.", ta: "நீங்கள் அறுவடை செய்ததன் எளிய பதிவை வைத்திருங்கள்." },
    ],
    quiz: [
      {
        question: { en: "How many hours of sun do most vegetables need each day?", si: "බොහෝ එළවළුවලට දිනකට හිරු එළිය පැය කීයක් අවශ්‍යද?", ta: "பெரும்பாலான காய்கறிகளுக்கு நாளொன்றுக்கு எத்தனை மணி நேர வெயில் தேவை?" },
        options: [
          { en: "1 to 2 hours", si: "පැය 1-2", ta: "1-2 மணி நேரம்" },
          { en: "5 to 6 hours", si: "පැය 5-6", ta: "5-6 மணி நேரம்" },
          { en: "None, shade is best", si: "කිසිවක් නැත, සෙවන හොඳයි", ta: "எதுவும் இல்லை, நிழலே சிறந்தது" },
        ],
        answer: 1,
      },
      {
        question: { en: "What should you do before moving seedlings into full sun?", si: "පැළ සම්පූර්ණ හිරු එළියට ගෙනයාමට පෙර කළ යුත්තේ කුමක්ද?", ta: "நாற்றுகளை முழு வெயிலுக்கு மாற்றும் முன் என்ன செய்ய வேண்டும்?" },
        options: [
          { en: "Harden them off over a few days", si: "දින කිහිපයක් පුරා හිරුට හුරු කරන්න", ta: "சில நாட்களில் வெயிலுக்குப் பழக்கவும்" },
          { en: "Cut off their leaves", si: "ඒවායේ කොළ කපා දමන්න", ta: "அவற்றின் இலைகளை வெட்டவும்" },
          { en: "Stop watering them", si: "වතුර දැමීම නවත්වන්න", ta: "நீர் ஊற்றுவதை நிறுத்தவும்" },
        ],
        answer: 0,
      },
      {
        question: { en: "What helps keep the soil moist in the dry months?", si: "වියළි මාසවල පස තෙත්ව තබා ගැනීමට උපකාරී වන්නේ කුමක්ද?", ta: "உலர் மாதங்களில் மண்ணை ஈரமாக வைக்க எது உதவும்?" },
        options: [
          { en: "Adding sand on top", si: "ඉහළින් වැලි දැමීම", ta: "மேலே மணல் இடுதல்" },
          { en: "Watering only once a week", si: "සතියකට වරක් පමණක් වතුර දැමීම", ta: "வாரத்திற்கு ஒருமுறை மட்டும் நீர் ஊற்றுதல்" },
          { en: "A layer of mulch", si: "වසුන් තට්ටුවක්", ta: "மூடாக்கு அடுக்கு" },
        ],
        answer: 2,
      },
    ],
  },
  {
    id: "seeds",
    icon: "🌱",
    badgeLabel: "SEEDS",
    colors: ["#fbbf24", "#b45309"],
    name: { en: "Aswedduma Certified Seeds", si: "අස්වැද්දුම සහතික බීජ", ta: "அஸ்வெத்தும சான்றளிக்கப்பட்ட விதைகள்" },
    forWho: { en: "Growers and small businesses who save, pack or sell vegetable seeds.", si: "එළවළු බීජ එකතු කරන, ඇසුරුම් කරන හෝ විකුණන වගාකරුවන් සහ කුඩා ව්‍යාපාර.", ta: "காய்கறி விதைகளைச் சேமிக்கும், பொதி செய்யும் அல்லது விற்கும் விவசாயிகள் மற்றும் சிறு வணிகங்கள்." },
    lessons: [
      {
        title: { en: "Choose the right parent plants", si: "නිවැරදි මව් පැළ තෝරන්න", ta: "சரியான தாய்ச் செடிகளைத் தேர்ந்தெடுக்கவும்" },
        text: { en: "Save seed only from healthy, strong plants that are true to their variety.", si: "ප්‍රභේදයට ගැළපෙන, නිරෝගී, ශක්තිමත් පැළවලින් පමණක් බීජ එකතු කරන්න.", ta: "வகைக்கு ஏற்ற, ஆரோக்கியமான, வலுவான செடிகளிலிருந்து மட்டுமே விதை சேமிக்கவும்." },
      },
      {
        title: { en: "Dry and store seed properly", si: "බීජ නිවැරදිව වියළා ගබඩා කරන්න", ta: "விதைகளைச் சரியாக உலர்த்திச் சேமிக்கவும்" },
        text: { en: "Dry seed fully in shade, then keep it in sealed containers somewhere cool, dry and dark.", si: "බීජ සෙවනේ සම්පූර්ණයෙන් වියළා, සිසිල්, වියළි, අඳුරු තැනක මුද්‍රා තැබූ බඳුන්වල තබන්න.", ta: "விதைகளை நிழலில் முழுமையாக உலர்த்தி, குளிர்ந்த, உலர்ந்த, இருண்ட இடத்தில் மூடிய கொள்கலன்களில் வைக்கவும்." },
      },
      {
        title: { en: "Test germination and label every packet", si: "පැළවීම පරීක්ෂා කර සෑම පැකට්ටුවක්ම ලේබල් කරන්න", ta: "முளைப்பைச் சோதித்து ஒவ்வொரு பாக்கெட்டையும் லேபிளிடவும்" },
        text: { en: "Sprout a sample on damp paper to see how many grow, and write the variety, batch and packing date on each packet.", si: "කීයක් පැළවේදැයි බැලීමට තෙත් කඩදාසියක නියැදියක් පැළ කර, සෑම පැකට්ටුවකම ප්‍රභේදය, කාණ්ඩය සහ ඇසුරුම් දිනය ලියන්න.", ta: "எத்தனை முளைக்கின்றன என்று பார்க்க ஈரத் தாளில் மாதிரியை முளைக்க வைத்து, ஒவ்வொரு பாக்கெட்டிலும் வகை, தொகுதி, பொதி தேதியை எழுதுங்கள்." },
      },
    ],
    requirements: [
      { en: "Tell us where your seed comes from and which varieties you offer.", si: "ඔබේ බීජ පැමිණෙන්නේ කොහෙන්ද සහ ඔබ ලබා දෙන ප්‍රභේද මොනවාදැයි අපට කියන්න.", ta: "உங்கள் விதைகள் எங்கிருந்து வருகின்றன, எந்த வகைகளை வழங்குகிறீர்கள் என்று எங்களிடம் சொல்லுங்கள்." },
      { en: "Send a sample batch for a germination test by the Aswedduma team.", si: "අස්වැද්දුම කණ්ඩායම විසින් පැළවීමේ පරීක්ෂණයක් සඳහා නියැදි කාණ්ඩයක් එවන්න.", ta: "அஸ்வெத்தும குழுவின் முளைப்புச் சோதனைக்கு ஒரு மாதிரித் தொகுதியை அனுப்புங்கள்." },
      { en: "Label every packet with variety, batch and packing date.", si: "සෑම පැකට්ටුවක්ම ප්‍රභේදය, කාණ්ඩය සහ ඇසුරුම් දිනය සමඟ ලේබල් කරන්න.", ta: "ஒவ்வொரு பாக்கெட்டிலும் வகை, தொகுதி, பொதி தேதியை லேபிளிடுங்கள்." },
    ],
    quiz: [
      {
        question: { en: "Where should seeds be stored?", si: "බීජ ගබඩා කළ යුත්තේ කොහේද?", ta: "விதைகளை எங்கே சேமிக்க வேண்டும்?" },
        options: [
          { en: "Somewhere warm and sunny", si: "උණුසුම්, හිරු එළිය ඇති තැනක", ta: "வெப்பமான, வெயில் படும் இடத்தில்" },
          { en: "Somewhere cool, dry and dark", si: "සිසිල්, වියළි, අඳුරු තැනක", ta: "குளிர்ந்த, உலர்ந்த, இருண்ட இடத்தில்" },
          { en: "In a damp cloth", si: "තෙත් රෙද්දක", ta: "ஈரத் துணியில்" },
        ],
        answer: 1,
      },
      {
        question: { en: "What does a germination test tell you?", si: "පැළවීමේ පරීක්ෂණයකින් ඔබට දැනගත හැක්කේ කුමක්ද?", ta: "முளைப்புச் சோதனை உங்களுக்கு என்ன சொல்லும்?" },
        options: [
          { en: "How many seeds will sprout", si: "බීජ කීයක් පැළවේද", ta: "எத்தனை விதைகள் முளைக்கும்" },
          { en: "How much the seeds weigh", si: "බීජවල බර කොපමණද", ta: "விதைகளின் எடை எவ்வளவு" },
          { en: "What colour the fruit will be", si: "ගෙඩිවල වර්ණය කුමක්ද", ta: "காயின் நிறம் என்ன" },
        ],
        answer: 0,
      },
      {
        question: { en: "Which plants should you save seed from?", si: "බීජ එකතු කළ යුත්තේ කුමන පැළවලින්ද?", ta: "எந்தச் செடிகளிலிருந்து விதை சேமிக்க வேண்டும்?" },
        options: [
          { en: "The first plants to wilt", si: "පළමුව මැලවෙන පැළ", ta: "முதலில் வாடும் செடிகள்" },
          { en: "Any plant at all", si: "ඕනෑම පැළයක්", ta: "எந்தச் செடியும்" },
          { en: "Healthy plants true to their variety", si: "ප්‍රභේදයට ගැළපෙන නිරෝගී පැළ", ta: "வகைக்கு ஏற்ற ஆரோக்கியமான செடிகள்" },
        ],
        answer: 2,
      },
    ],
  },
  {
    id: "plantation",
    icon: "🍃",
    badgeLabel: "PLANTATION",
    colors: ["#2dd4bf", "#0f766e"],
    name: { en: "Aswedduma Certified Plantation", si: "අස්වැද්දුම සහතික වැවිල්ල", ta: "அஸ்வெத்தும சான்றளிக்கப்பட்ட பெருந்தோட்டம்" },
    forWho: { en: "Cinnamon and tea growers, from smallholders to estates.", si: "කුඩා ඉඩම් හිමියන්ගේ සිට වතු දක්වා කුරුඳු සහ තේ වගාකරුවන්.", ta: "சிறு நில உரிமையாளர்கள் முதல் தோட்டங்கள் வரை கறுவா மற்றும் தேயிலை விவசாயிகள்." },
    lessons: [
      {
        title: { en: "Know your numbers", si: "ඔබේ ගණන් දැනගන්න", ta: "உங்கள் கணக்குகளை அறியுங்கள்" },
        text: { en: "Work out setup cost, payback and NPV for your land with the plantation calculator.", si: "වැවිලි ගණක යන්ත්‍රය භාවිතයෙන් ඔබේ ඉඩමට සැකසුම් වියදම, ආපසු ලැබීම සහ NPV ගණනය කරන්න.", ta: "பெருந்தோட்டக் கணிப்பானைக் கொண்டு உங்கள் நிலத்திற்கான அமைப்புச் செலவு, திருப்பிப் பெறுதல், NPV ஐக் கணக்கிடுங்கள்." },
        href: "/plantation",
      },
      {
        title: { en: "Test the land before planting", si: "සිටුවීමට පෙර ඉඩම පරීක්ෂා කරන්න", ta: "நடுவதற்கு முன் நிலத்தைச் சோதிக்கவும்" },
        text: { en: "Check soil pH, drainage and slope, and plant recommended varieties at the start of the rains.", si: "පසේ pH, ජලය බැසයාම සහ බෑවුම පරීක්ෂා කර, වැසි ආරම්භයේදී නිර්දේශිත ප්‍රභේද සිටුවන්න.", ta: "மண்ணின் pH, வடிகால், சரிவைச் சரிபார்த்து, மழை தொடங்கும்போது பரிந்துரைக்கப்பட்ட வகைகளை நடவும்." },
      },
      {
        title: { en: "Keep good records", si: "හොඳ වාර්තා තබා ගන්න", ta: "நல்ல பதிவுகளை வைத்திருங்கள்" },
        text: { en: "Record inputs, sprays, workers and harvests so buyers can trust where your crop comes from.", si: "ඔබේ අස්වැන්න පැමිණෙන තැන ගැනුම්කරුවන්ට විශ්වාස කළ හැකි වන පරිදි යෙදවුම්, ඉසීම්, කම්කරුවන් සහ අස්වනු වාර්තා කරන්න.", ta: "உங்கள் பயிர் எங்கிருந்து வருகிறது என்பதை வாங்குபவர்கள் நம்பும்படி இடுபொருட்கள், தெளிப்புகள், தொழிலாளர்கள், அறுவடைகளைப் பதிவு செய்யுங்கள்." },
      },
    ],
    requirements: [
      { en: "Share your land size, location and crop.", si: "ඔබේ ඉඩමේ ප්‍රමාණය, ස්ථානය සහ බෝගය බෙදාගන්න.", ta: "உங்கள் நில அளவு, இடம், பயிரைப் பகிருங்கள்." },
      { en: "Welcome a field visit from the Aswedduma team.", si: "අස්වැද්දුම කණ්ඩායමේ ක්ෂේත්‍ර නිරීක්ෂණයක් සඳහා අවසර දෙන්න.", ta: "அஸ்வெத்தும குழுவின் கள வருகையை வரவேற்கவும்." },
      { en: "Keep input and harvest records for one season.", si: "එක් කන්නයක් සඳහා යෙදවුම් සහ අස්වනු වාර්තා තබා ගන්න.", ta: "ஒரு பருவத்திற்கு இடுபொருள் மற்றும் அறுவடைப் பதிவுகளை வைத்திருங்கள்." },
    ],
    quiz: [
      {
        question: { en: "When is the best time to plant new cinnamon or tea?", si: "නව කුරුඳු හෝ තේ සිටුවීමට හොඳම කාලය කුමක්ද?", ta: "புதிய கறுவா அல்லது தேயிலையை நட சிறந்த நேரம் எது?" },
        options: [
          { en: "In the middle of the dry season", si: "වියළි කාලයේ මැද", ta: "உலர் பருவத்தின் நடுவில்" },
          { en: "At the start of the rains", si: "වැසි ආරම්භයේදී", ta: "மழை தொடங்கும்போது" },
          { en: "It makes no difference", si: "වෙනසක් නැත", ta: "வேறுபாடு இல்லை" },
        ],
        answer: 1,
      },
      {
        question: { en: "What does NPV tell you?", si: "NPV ඔබට කියන්නේ කුමක්ද?", ta: "NPV உங்களுக்கு என்ன சொல்கிறது?" },
        options: [
          { en: "Today's value of the money the plantation will earn", si: "වැවිල්ල උපයන මුදලේ අද වටිනාකම", ta: "பெருந்தோட்டம் ஈட்டும் பணத்தின் இன்றைய மதிப்பு" },
          { en: "The yield of one bush", si: "එක් පඳුරක අස්වැන්න", ta: "ஒரு புதரின் விளைச்சல்" },
          { en: "The number of workers needed", si: "අවශ්‍ය කම්කරුවන් ගණන", ta: "தேவையான தொழிலாளர்களின் எண்ணிக்கை" },
        ],
        answer: 0,
      },
      {
        question: { en: "Why test the soil before planting?", si: "සිටුවීමට පෙර පස පරීක්ෂා කරන්නේ ඇයි?", ta: "நடுவதற்கு முன் மண்ணை ஏன் சோதிக்க வேண்டும்?" },
        options: [
          { en: "To check its colour", si: "එහි වර්ණය බැලීමට", ta: "அதன் நிறத்தைப் பார்க்க" },
          { en: "It is not needed", si: "එය අවශ්‍ය නැත", ta: "அது தேவையில்லை" },
          { en: "To know its pH and what it needs", si: "එහි pH සහ අවශ්‍යතා දැන ගැනීමට", ta: "அதன் pH மற்றும் தேவைகளை அறிய" },
        ],
        answer: 2,
      },
    ],
  },
];

export function getTrack(id: string): CertTrack | undefined {
  return CERT_TRACKS.find((track) => track.id === id);
}
