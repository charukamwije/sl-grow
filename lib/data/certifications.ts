/**
 * ==== ASWEDDUMA CERTIFIED: THE COURSES (the Join page) ====
 *
 * Each path is a free course (modules of short lessons, each module ending
 * in a quiz), then Apply (practical requirements and an application on
 * WhatsApp), then Certified (a digital badge issued by the Aswedduma team
 * after review). This is Aswedduma's own programme, not a government
 * certificate.
 *
 * Written for readers of every level: short sentences, everyday words, one
 * idea per point, a picture per lesson. Lessons and questions need an
 * agronomist's review (OI-06); Sinhala and Tamil a translator's (OI-05).
 */
import type { Localized } from "../i18n/types";

export type Lesson = {
  /** The lesson's picture, shown large */
  icon: string;
  title: Localized;
  /** Three short points, one idea each */
  points: Localized[];
  /** Something to do at home or on the farm */
  task: Localized;
  /** A guide or tool in the app that goes deeper */
  href?: string;
};

export type Question = {
  question: Localized;
  options: Localized[];
  /** Index of the correct option */
  answer: number;
};

export type CourseModule = {
  id: string;
  icon: string;
  title: Localized;
  lessons: Lesson[];
  quiz: Question[];
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
  modules: CourseModule[];
  requirements: Localized[];
};

const L = (en: string, si: string, ta: string): Localized => ({ en, si, ta });

export const CERT_TRACKS: CertTrack[] = [
  // =====================================================================
  {
    id: "home-grower",
    icon: "🏡",
    badgeLabel: "HOME GROWER",
    colors: ["#34d399", "#047857"],
    name: L("Aswedduma Certified Home Grower", "අස්වැද්දුම සහතික ගෙවතු වගාකරු", "அஸ்வெத்தும சான்றளிக்கப்பட்ட வீட்டுத் தோட்டக்காரர்"),
    forWho: L(
      "Families growing vegetables at home, on a balcony or rooftop.",
      "ගෙදර, බැල්කනියේ හෝ වහලය මත එළවළු වවන පවුල්.",
      "வீட்டில், பால்கனியில் அல்லது மொட்டை மாடியில் காய்கறி வளர்க்கும் குடும்பங்கள்."
    ),
    modules: [
      {
        id: "get-ready",
        icon: "🧰",
        title: L("Get ready", "සූදානම් වන්න", "தயாராகுங்கள்"),
        lessons: [
          {
            icon: "☀️",
            title: L("Find a sunny spot", "හිරු එළිය ඇති තැනක් සොයන්න", "வெயில் படும் இடத்தைக் கண்டுபிடியுங்கள்"),
            points: [
              L("Most vegetables need 5 to 6 hours of sun a day.", "බොහෝ එළවළුවලට දිනකට පැය 5-6 ක හිරු එළිය අවශ්‍යයි.", "பெரும்பாலான காய்கறிகளுக்கு நாளொன்றுக்கு 5-6 மணி நேர வெயில் தேவை."),
              L("Watch your space for one day. See where the sun falls.", "එක් දිනක් ඔබේ ඉඩ බලන්න. හිරු එළිය වැටෙන තැන බලන්න.", "ஒரு நாள் உங்கள் இடத்தைக் கவனியுங்கள். வெயில் எங்கே படுகிறது என்று பாருங்கள்."),
              L("Choose a place close to a water tap.", "ජල කරාමයකට ආසන්න තැනක් තෝරන්න.", "நீர்க் குழாய்க்கு அருகிலுள்ள இடத்தைத் தேர்ந்தெடுங்கள்."),
            ],
            task: L("Find and mark the sunniest spot at your home.", "ඔබේ නිවසේ වැඩිම හිරු එළිය ඇති තැන සොයා සලකුණු කරන්න.", "உங்கள் வீட்டில் அதிக வெயில் படும் இடத்தைக் கண்டுபிடித்துக் குறியுங்கள்."),
          },
          {
            icon: "🪴",
            title: L("Choose containers", "බඳුන් තෝරන්න", "கொள்கலன்களைத் தேர்ந்தெடுங்கள்"),
            points: [
              L("Grow bags and pots work well on balconies and rooftops.", "වගා බෑග් සහ බඳුන් බැල්කනි සහ වහල මත හොඳින් ක්‍රියා කරයි.", "வளர்ப்புப் பைகளும் தொட்டிகளும் பால்கனியிலும் மாடியிலும் நன்றாகப் பயன்படும்."),
              L("Every container needs holes at the bottom, so extra water can drain.", "අමතර වතුර බැස යාමට සෑම බඳුනකම පතුලේ සිදුරු තිබිය යුතුයි.", "கூடுதல் நீர் வடிய ஒவ்வொரு கொள்கலனின் அடியிலும் துளைகள் வேண்டும்."),
              L("Big plants like tomato need a 15 litre bag.", "තක්කාලි වැනි විශාල පැළවලට ලීටර් 15 බෑගයක් අවශ්‍යයි.", "தக்காளி போன்ற பெரிய செடிகளுக்கு 15 லிட்டர் பை தேவை."),
            ],
            task: L("Check that all your containers have drainage holes.", "ඔබේ සියලු බඳුන්වල ජලය බැසයන සිදුරු ඇත්දැයි පරීක්ෂා කරන්න.", "உங்கள் எல்லாக் கொள்கலன்களிலும் வடிகால் துளைகள் உள்ளதா எனப் பாருங்கள்."),
          },
          {
            icon: "🟤",
            title: L("Make good soil", "හොඳ පසක් සාදන්න", "நல்ல மண்ணைத் தயாரியுங்கள்"),
            points: [
              L("Mix one part soil, one part compost and one part coco peat.", "පස් කොටසක්, කොම්පෝස්ට් කොටසක් සහ කොහු බත් කොටසක් මිශ්‍ර කරන්න.", "ஒரு பங்கு மண், ஒரு பங்கு உரம், ஒரு பங்கு தேங்காய் நார் கலக்குங்கள்."),
              L("Add a little organic fertilizer.", "කාබනික පොහොර ටිකක් එක් කරන්න.", "சிறிது இயற்கை உரம் சேர்க்கவும்."),
              L("Water the mix and let it rest for two weeks.", "මිශ්‍රණයට වතුර දමා සති දෙකක් තබන්න.", "கலவைக்கு நீர் ஊற்றி இரண்டு வாரங்கள் விடுங்கள்."),
            ],
            task: L("Make one bag of potting mix.", "එක් බෑගයක් පස් මිශ්‍රණය සාදන්න.", "ஒரு பை மண் கலவை தயாரியுங்கள்."),
            href: "/guides/soil",
          },
        ],
        quiz: [
          {
            question: L("How many hours of sun do most vegetables need each day?", "බොහෝ එළවළුවලට දිනකට හිරු එළිය පැය කීයක් අවශ්‍යද?", "பெரும்பாலான காய்கறிகளுக்கு நாளொன்றுக்கு எத்தனை மணி நேர வெயில் தேவை?"),
            options: [L("1 to 2 hours", "පැය 1-2", "1-2 மணி நேரம்"), L("5 to 6 hours", "පැය 5-6", "5-6 மணி நேரம்"), L("None, shade is best", "කිසිවක් නැත, සෙවන හොඳයි", "எதுவும் இல்லை, நிழலே சிறந்தது")],
            answer: 1,
          },
          {
            question: L("Why do containers need holes at the bottom?", "බඳුන්වල පතුලේ සිදුරු අවශ්‍ය ඇයි?", "கொள்கலன்களின் அடியில் ஏன் துளைகள் வேண்டும்?"),
            options: [L("So extra water can drain out", "අමතර වතුර බැස යාමට", "கூடுதல் நீர் வடிய"), L("To let insects in", "කෘමීන්ට ඇතුළු වීමට", "பூச்சிகள் உள்ளே வர"), L("To make them lighter", "ඒවා සැහැල්ලු කිරීමට", "அவற்றை இலேசாக்க")],
            answer: 0,
          },
        ],
      },
      {
        id: "plant-care",
        icon: "🌱",
        title: L("Plant and care", "සිටුවීම සහ රැකවරණය", "நடவும் பராமரிப்பும்"),
        lessons: [
          {
            icon: "🌱",
            title: L("Plant your seedlings", "ඔබේ පැළ සිටුවන්න", "நாற்றுகளை நடுங்கள்"),
            points: [
              L("Keep new seedlings in light shade for a few days first.", "නව පැළ මුලින් දින කිහිපයක් සැහැල්ලු සෙවනේ තබන්න.", "புதிய நாற்றுகளை முதலில் சில நாட்கள் லேசான நிழலில் வையுங்கள்."),
              L("Plant in the evening, as deep as they were in the tray.", "සවස් කාලයේ, තැටියේ තිබූ ගැඹුරටම සිටුවන්න.", "மாலையில், தட்டில் இருந்த அதே ஆழத்தில் நடுங்கள்."),
              L("Water well straight after planting.", "සිටුවූ වහාම හොඳින් වතුර දමන්න.", "நட்டவுடன் நன்றாக நீர் ஊற்றுங்கள்."),
            ],
            task: L("Keep your seedlings in light shade for three days.", "ඔබේ පැළ දින තුනක් සැහැල්ලු සෙවනේ තබන්න.", "உங்கள் நாற்றுகளை மூன்று நாட்கள் லேசான நிழலில் வையுங்கள்."),
            href: "/guides/tomato",
          },
          {
            icon: "💧",
            title: L("Water the right way", "නිවැරදිව වතුර දමන්න", "சரியாக நீர் ஊற்றுங்கள்"),
            points: [
              L("Water every morning, at the base of the plant.", "සෑම උදෑසනකම පැළයේ මුලට වතුර දමන්න.", "ஒவ்வொரு காலையும் செடியின் அடியில் நீர் ஊற்றுங்கள்."),
              L("Keep the soil damp, but not wet like mud.", "පස තෙත්ව තබන්න, නමුත් මඩ මෙන් නොවේ.", "மண்ணை ஈரமாக வையுங்கள், ஆனால் சேறு போல் அல்ல."),
              L("In hot weather, water again in the evening.", "උෂ්ණ කාලයේ සවසද නැවත වතුර දමන්න.", "வெப்பமான நாட்களில் மாலையிலும் மீண்டும் நீர் ஊற்றுங்கள்."),
            ],
            task: L("Push a finger into the soil. If it feels dry, water.", "පසට ඇඟිල්ලක් ඔබන්න. වියළි නම් වතුර දමන්න.", "மண்ணில் விரலை அழுத்துங்கள். உலர்ந்திருந்தால் நீர் ஊற்றுங்கள்."),
          },
          {
            icon: "🎋",
            title: L("Feed and support", "පොහොර සහ ආධාරක", "உரமும் தாங்கியும்"),
            points: [
              L("From week 3, add a handful of organic fertilizer every 2 weeks.", "3 වන සතියේ සිට, සති 2 කට වරක් කාබනික පොහොර අතලොස්සක් යොදන්න.", "3வது வாரத்திலிருந்து, 2 வாரங்களுக்கு ஒருமுறை ஒரு கைப்பிடி இயற்கை உரம் இடுங்கள்."),
              L("Tie tall plants to a stick, so they do not fall.", "උස පැළ වැටීම වැළැක්වීමට කූරකට බැඳින්න.", "உயரமான செடிகள் விழாமல் இருக்க குச்சியில் கட்டுங்கள்."),
              L("Give climbing plants a net to climb.", "වැල් පැළවලට නැගීමට දැලක් දෙන්න.", "கொடிச் செடிகள் ஏற ஒரு வலை கொடுங்கள்."),
            ],
            task: L("Put a stick next to one tall plant and tie it loosely.", "එක් උස පැළයක් අසල කූරක් සිටුවා ලිහිල්ව බැඳින්න.", "ஒரு உயரமான செடியின் அருகே குச்சி நட்டு தளர்வாகக் கட்டுங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("What should you do before moving seedlings into full sun?", "පැළ සම්පූර්ණ හිරු එළියට ගෙනයාමට පෙර කළ යුත්තේ කුමක්ද?", "நாற்றுகளை முழு வெயிலுக்கு மாற்றும் முன் என்ன செய்ய வேண்டும்?"),
            options: [L("Keep them in light shade for a few days", "දින කිහිපයක් සැහැල්ලු සෙවනේ තබන්න", "சில நாட்கள் லேசான நிழலில் வையுங்கள்"), L("Cut off their leaves", "ඒවායේ කොළ කපා දමන්න", "அவற்றின் இலைகளை வெட்டுங்கள்"), L("Stop watering them", "වතුර දැමීම නවත්වන්න", "நீர் ஊற்றுவதை நிறுத்துங்கள்")],
            answer: 0,
          },
          {
            question: L("When is the best time to water?", "වතුර දැමීමට හොඳම කාලය කුමක්ද?", "நீர் ஊற்ற சிறந்த நேரம் எது?"),
            options: [L("At midday, over the leaves", "දහවල්, කොළ මතට", "நண்பகலில், இலைகளின் மேல்"), L("In the morning, at the base of the plant", "උදෑසන, පැළයේ මුලට", "காலையில், செடியின் அடியில்"), L("Only once a week", "සතියකට වරක් පමණි", "வாரத்திற்கு ஒருமுறை மட்டும்")],
            answer: 1,
          },
        ],
      },
      {
        id: "protect-harvest",
        icon: "🧺",
        title: L("Protect and harvest", "ආරක්ෂා කර අස්වනු නෙළන්න", "பாதுகாத்து அறுவடை செய்யுங்கள்"),
        lessons: [
          {
            icon: "🐛",
            title: L("Check for pests", "පළිබෝධ පරීක්ෂා කරන්න", "பூச்சிகளைச் சரிபாருங்கள்"),
            points: [
              L("Look under the leaves twice a week.", "සතියකට දෙවරක් කොළ යට බලන්න.", "வாரத்திற்கு இருமுறை இலைகளின் அடியில் பாருங்கள்."),
              L("Pick off insects by hand when you see them.", "කෘමීන් දුටු විට අතින් ඉවත් කරන්න.", "பூச்சிகளைக் கண்டால் கையால் அகற்றுங்கள்."),
              L("If there are many, spray neem oil in the evening.", "බොහෝ ඇත්නම් සවස කොහොඹ තෙල් ඉසින්න.", "அதிகமாக இருந்தால் மாலையில் வேப்ப எண்ணெய் தெளியுங்கள்."),
            ],
            task: L("Check under five leaves today.", "අද කොළ පහක් යට පරීක්ෂා කරන්න.", "இன்று ஐந்து இலைகளின் அடியில் சரிபாருங்கள்."),
          },
          {
            icon: "🍂",
            title: L("Keep the soil moist", "පස තෙත්ව තබන්න", "மண்ணை ஈரமாக வையுங்கள்"),
            points: [
              L("Cover the soil with dry leaves or straw. This is called mulch.", "පස වියළි කොළ හෝ පිදුරු වලින් වසන්න. මෙය වසුන් ලෙස හැඳින්වේ.", "மண்ணை உலர்ந்த இலைகள் அல்லது வைக்கோலால் மூடுங்கள். இது மூடாக்கு எனப்படும்."),
              L("Mulch keeps water in and weeds out.", "වසුන් වතුර රඳවා වල් පැළ වළක්වයි.", "மூடாக்கு நீரைத் தக்கவைத்து களைகளைத் தடுக்கும்."),
              L("Pull out weeds while they are small.", "වල් පැළ කුඩා විටම ගලවන්න.", "களைகள் சிறியதாக இருக்கும்போதே பிடுங்குங்கள்."),
            ],
            task: L("Put a layer of mulch on one pot.", "එක් බඳුනකට වසුන් තට්ටුවක් දමන්න.", "ஒரு தொட்டியில் மூடாக்கு அடுக்கு இடுங்கள்."),
          },
          {
            icon: "🧺",
            title: L("Harvest and keep a record", "අස්වනු නෙළා වාර්තා තබන්න", "அறுவடை செய்து பதிவு வையுங்கள்"),
            points: [
              L("Pick vegetables when they are ready, not too late.", "එළවළු සූදානම් වූ විට නෙළන්න, ප්‍රමාද නොකරන්න.", "காய்கறிகள் தயாரானதும் பறியுங்கள், தாமதிக்காதீர்கள்."),
              L("Picking often makes many plants give more.", "නිතර නෙළීමෙන් බොහෝ පැළ වැඩිපුර ඵල දරයි.", "அடிக்கடி பறிப்பதால் பல செடிகள் அதிகம் காய்க்கும்."),
              L("Write down what you harvest each week.", "සෑම සතියකම ඔබ නෙළූ දේ ලියා තබන්න.", "ஒவ்வொரு வாரமும் அறுவடை செய்ததை எழுதுங்கள்."),
            ],
            task: L("Start a harvest notebook.", "අස්වනු සටහන් පොතක් අරඹන්න.", "அறுவடைக் குறிப்பேடு தொடங்குங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("What helps keep the soil moist in the dry months?", "වියළි මාසවල පස තෙත්ව තබා ගැනීමට උපකාරී වන්නේ කුමක්ද?", "உலர் மாதங்களில் மண்ணை ஈரமாக வைக்க எது உதவும்?"),
            options: [L("Adding sand on top", "ඉහළින් වැලි දැමීම", "மேலே மணல் இடுதல்"), L("Watering only once a week", "සතියකට වරක් පමණක් වතුර දැමීම", "வாரத்திற்கு ஒருமுறை மட்டும் நீர் ஊற்றுதல்"), L("A layer of mulch", "වසුන් තට්ටුවක්", "மூடாக்கு அடுக்கு")],
            answer: 2,
          },
          {
            question: L("Why pick vegetables often?", "එළවළු නිතර නෙළන්නේ ඇයි?", "காய்கறிகளை ஏன் அடிக்கடி பறிக்க வேண்டும்?"),
            options: [L("Many plants then give more", "එවිට බොහෝ පැළ වැඩිපුර ඵල දරයි", "அப்போது பல செடிகள் அதிகம் காய்க்கும்"), L("To stop the plant growing", "පැළය වැඩීම නැවැත්වීමට", "செடி வளர்வதை நிறுத்த"), L("It makes no difference", "වෙනසක් නැත", "வேறுபாடு இல்லை")],
            answer: 0,
          },
        ],
      },
    ],
    requirements: [
      L("Grow at least three vegetables through one full season.", "අවම වශයෙන් එළවළු තුනක් එක් සම්පූර්ණ කන්නයක් පුරා වවන්න.", "குறைந்தது மூன்று காய்கறிகளை ஒரு முழுப் பருவம் வளர்க்கவும்."),
      L("Share photos of your garden at planting and at harvest.", "සිටුවීමේදී සහ අස්වැන්නේදී ඔබේ ගෙවත්තේ ඡායාරූප බෙදාගන්න.", "நடவின்போதும் அறுவடையின்போதும் உங்கள் தோட்டத்தின் படங்களைப் பகிருங்கள்."),
      L("Keep a simple record of what you harvested.", "ඔබ නෙළූ දේ පිළිබඳ සරල වාර්තාවක් තබා ගන්න.", "நீங்கள் அறுவடை செய்ததன் எளிய பதிவை வைத்திருங்கள்."),
    ],
  },

  // =====================================================================
  {
    id: "seeds",
    icon: "🌱",
    badgeLabel: "SEEDS",
    colors: ["#fbbf24", "#b45309"],
    name: L("Aswedduma Certified Seeds", "අස්වැද්දුම සහතික බීජ", "அஸ்வெத்தும சான்றளிக்கப்பட்ட விதைகள்"),
    forWho: L(
      "Growers and small businesses who save, pack or sell vegetable seeds.",
      "එළවළු බීජ එකතු කරන, ඇසුරුම් කරන හෝ විකුණන වගාකරුවන් සහ කුඩා ව්‍යාපාර.",
      "காய்கறி விதைகளைச் சேமிக்கும், பொதி செய்யும் அல்லது விற்கும் விவசாயிகள் மற்றும் சிறு வணிகங்கள்."
    ),
    modules: [
      {
        id: "parent-plants",
        icon: "🌿",
        title: L("Choose good parent plants", "හොඳ මව් පැළ තෝරන්න", "நல்ல தாய்ச் செடிகளைத் தேர்ந்தெடுங்கள்"),
        lessons: [
          {
            icon: "💪",
            title: L("Healthy plants only", "නිරෝගී පැළ පමණි", "ஆரோக்கியமான செடிகள் மட்டும்"),
            points: [
              L("Save seed only from strong, healthy plants.", "ශක්තිමත්, නිරෝගී පැළවලින් පමණක් බීජ එකතු කරන්න.", "வலுவான, ஆரோக்கியமான செடிகளிலிருந்து மட்டுமே விதை சேமியுங்கள்."),
              L("Do not save seed from sick or weak plants.", "රෝගී හෝ දුර්වල පැළවලින් බීජ එකතු නොකරන්න.", "நோயுற்ற அல்லது பலவீனமான செடிகளிலிருந்து விதை சேமிக்காதீர்கள்."),
              L("Choose plants that gave good fruit.", "හොඳ ඵල දැරූ පැළ තෝරන්න.", "நல்ல காய் தந்த செடிகளைத் தேர்ந்தெடுங்கள்."),
            ],
            task: L("Tie a ribbon on your best plant.", "ඔබේ හොඳම පැළයට පටියක් බැඳින්න.", "உங்கள் சிறந்த செடியில் ஒரு நாடா கட்டுங்கள்."),
          },
          {
            icon: "🏷️",
            title: L("True to their variety", "ප්‍රභේදයට ගැළපෙන", "வகைக்கு ஏற்றவை"),
            points: [
              L("Choose plants that look like their variety.", "තම ප්‍රභේදයට සමාන පෙනුමක් ඇති පැළ තෝරන්න.", "தங்கள் வகையைப் போலவே தோன்றும் செடிகளைத் தேர்ந்தெடுங்கள்."),
              L("Seed from hybrid plants may grow into different plants.", "දෙමුහුන් පැළවල බීජවලින් වෙනස් පැළ වැඩිය හැක.", "கலப்பினச் செடிகளின் விதைகள் வேறுபட்ட செடிகளாக வளரலாம்."),
              L("Keep different varieties apart, so they do not mix.", "විවිධ ප්‍රභේද මිශ්‍ර නොවන සේ වෙන් කර තබන්න.", "வெவ்வேறு வகைகள் கலக்காமல் தனியாக வையுங்கள்."),
            ],
            task: L("Write down the variety of each plant.", "සෑම පැළයකම ප්‍රභේදය ලියා තබන්න.", "ஒவ்வொரு செடியின் வகையையும் எழுதுங்கள்."),
          },
          {
            icon: "⏳",
            title: L("Let the seed ripen", "බීජ ඉදෙන්නට ඉඩ දෙන්න", "விதை முற்ற விடுங்கள்"),
            points: [
              L("Leave fruit on the plant until it is fully ripe.", "ගෙඩිය සම්පූර්ණයෙන් ඉදෙන තෙක් පැළයේම තබන්න.", "காய் முழுமையாகப் பழுக்கும் வரை செடியிலேயே விடுங்கள்."),
              L("Bean and okra pods should be dry and brown.", "බෝංචි සහ බණ්ඩක්කා කරල් වියළි සහ දුඹුරු විය යුතුයි.", "அவரை, வெண்டைக் காய்கள் உலர்ந்து பழுப்பாக இருக்க வேண்டும்."),
              L("Tomato and cucumber fruit should be very ripe.", "තක්කාලි සහ පිපිඤ්ඤා ඉතා හොඳින් ඉදී තිබිය යුතුයි.", "தக்காளியும் வெள்ளரியும் நன்கு பழுத்திருக்க வேண்டும்."),
            ],
            task: L("Leave two pods on the plant to dry.", "කරල් දෙකක් වියළීමට පැළයේම තබන්න.", "இரண்டு காய்களை உலர செடியிலேயே விடுங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("Which plants should you save seed from?", "බීජ එකතු කළ යුත්තේ කුමන පැළවලින්ද?", "எந்தச் செடிகளிலிருந்து விதை சேமிக்க வேண்டும்?"),
            options: [L("The first plants to wilt", "පළමුව මැලවෙන පැළ", "முதலில் வாடும் செடிகள்"), L("Any plant at all", "ඕනෑම පැළයක්", "எந்தச் செடியும்"), L("Healthy plants true to their variety", "ප්‍රභේදයට ගැළපෙන නිරෝගී පැළ", "வகைக்கு ஏற்ற ஆரோக்கியமான செடிகள்")],
            answer: 2,
          },
          {
            question: L("When is fruit ready for saving seed?", "බීජ එකතු කිරීමට ගෙඩිය සූදානම් වන්නේ කවදාද?", "விதை சேமிக்கக் காய் எப்போது தயார்?"),
            options: [L("When it is fully ripe", "සම්පූර්ණයෙන් ඉදුණු විට", "முழுமையாகப் பழுத்தபோது"), L("When it is small and green", "කුඩා සහ කොළ පැහැ විට", "சிறியதாகவும் பச்சையாகவும் இருக்கும்போது"), L("At the first flower", "පළමු මල පිපෙන විට", "முதல் பூ பூக்கும்போது")],
            answer: 0,
          },
        ],
      },
      {
        id: "clean-dry-store",
        icon: "🫙",
        title: L("Clean, dry and store", "පිරිසිදු කර, වියළා, ගබඩා කරන්න", "சுத்தம் செய்து, உலர்த்தி, சேமியுங்கள்"),
        lessons: [
          {
            icon: "🚿",
            title: L("Clean the seed", "බීජ පිරිසිදු කරන්න", "விதையைச் சுத்தம் செய்யுங்கள்"),
            points: [
              L("Take the seeds out of the fruit.", "ගෙඩියෙන් බීජ ඉවතට ගන්න.", "காயிலிருந்து விதைகளை எடுங்கள்."),
              L("Wash wet seeds, like tomato, and spread them out.", "තක්කාලි වැනි තෙත් බීජ සෝදා පතුරන්න.", "தக்காளி போன்ற ஈர விதைகளைக் கழுவிப் பரப்புங்கள்."),
              L("Remove broken and very small seeds.", "කැඩුණු සහ ඉතා කුඩා බීජ ඉවත් කරන්න.", "உடைந்த மற்றும் மிகச் சிறிய விதைகளை அகற்றுங்கள்."),
            ],
            task: L("Clean the seeds from one ripe tomato.", "එක් ඉදුණු තක්කාලියක බීජ පිරිසිදු කරන්න.", "ஒரு பழுத்த தக்காளியின் விதைகளைச் சுத்தம் செய்யுங்கள்."),
          },
          {
            icon: "🌤️",
            title: L("Dry the seed well", "බීජ හොඳින් වියළන්න", "விதையை நன்கு உலர்த்துங்கள்"),
            points: [
              L("Dry seeds in the shade, not in strong sun.", "බීජ තද අව්වේ නොව සෙවනේ වියළන්න.", "விதைகளைக் கடும் வெயிலில் அல்ல, நிழலில் உலர்த்துங்கள்."),
              L("Spread them thin on paper or a tray.", "කඩදාසියක හෝ තැටියක තුනීව පතුරන්න.", "தாள் அல்லது தட்டில் மெல்லியதாகப் பரப்புங்கள்."),
              L("Seeds are dry when they snap, not bend.", "බීජ නැමෙනවා වෙනුවට කැඩෙන විට ඒවා වියළියි.", "விதைகள் வளையாமல் உடையும்போது உலர்ந்துவிட்டன."),
            ],
            task: L("Dry a batch of seeds for one week.", "බීජ කාණ්ඩයක් සතියක් වියළන්න.", "ஒரு தொகுதி விதைகளை ஒரு வாரம் உலர்த்துங்கள்."),
          },
          {
            icon: "🫙",
            title: L("Store safely", "ආරක්ෂිතව ගබඩා කරන්න", "பாதுகாப்பாகச் சேமியுங்கள்"),
            points: [
              L("Keep seeds in a sealed jar or packet.", "බීජ මුද්‍රා තැබූ භාජනයක හෝ පැකට්ටුවක තබන්න.", "விதைகளை மூடிய ஜாடி அல்லது பாக்கெட்டில் வையுங்கள்."),
              L("Store them in a cool, dry and dark place.", "සිසිල්, වියළි, අඳුරු තැනක ගබඩා කරන්න.", "குளிர்ந்த, உலர்ந்த, இருண்ட இடத்தில் சேமியுங்கள்."),
              L("Damp and heat kill seeds.", "තෙතමනය සහ උණුසුම බීජ විනාශ කරයි.", "ஈரமும் வெப்பமும் விதைகளைக் கொல்லும்."),
            ],
            task: L("Put your dried seeds in a sealed jar.", "ඔබේ වියළි බීජ මුද්‍රා තැබූ භාජනයකට දමන්න.", "உலர்ந்த விதைகளை மூடிய ஜாடியில் போடுங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("Where should seeds be stored?", "බීජ ගබඩා කළ යුත්තේ කොහේද?", "விதைகளை எங்கே சேமிக்க வேண்டும்?"),
            options: [L("Somewhere warm and sunny", "උණුසුම්, හිරු එළිය ඇති තැනක", "வெப்பமான, வெயில் படும் இடத்தில்"), L("Somewhere cool, dry and dark", "සිසිල්, වියළි, අඳුරු තැනක", "குளிர்ந்த, உலர்ந்த, இருண்ட இடத்தில்"), L("In a damp cloth", "තෙත් රෙද්දක", "ஈரத் துணியில்")],
            answer: 1,
          },
          {
            question: L("How should seeds be dried?", "බීජ වියළිය යුත්තේ කෙසේද?", "விதைகளை எப்படி உலர்த்த வேண்டும்?"),
            options: [L("In a closed plastic bag", "වසා ඇති ප්ලාස්ටික් බෑගයක", "மூடிய பிளாஸ்டிக் பையில்"), L("In strong midday sun", "තද දහවල් අව්වේ", "கடும் நண்பகல் வெயிலில்"), L("In the shade, spread thin", "සෙවනේ, තුනීව පතුරා", "நிழலில், மெல்லியதாகப் பரப்பி")],
            answer: 2,
          },
        ],
      },
      {
        id: "test-label",
        icon: "🧪",
        title: L("Test and label", "පරීක්ෂා කර ලේබල් කරන්න", "சோதித்து லேபிளிடுங்கள்"),
        lessons: [
          {
            icon: "🧪",
            title: L("Do a sprouting test", "පැළවීමේ පරීක්ෂණයක් කරන්න", "முளைப்புச் சோதனை செய்யுங்கள்"),
            points: [
              L("Put 10 seeds on wet paper and fold it.", "තෙත් කඩදාසියක බීජ 10 ක් තබා නවන්න.", "ஈரத் தாளில் 10 விதைகளை வைத்து மடியுங்கள்."),
              L("Keep the paper damp and wait a few days.", "කඩදාසිය තෙත්ව තබා දින කිහිපයක් බලා සිටින්න.", "தாளை ஈரமாக வைத்து சில நாட்கள் காத்திருங்கள்."),
              L("Count how many sprout. 8 out of 10 means 80%.", "කීයක් පැළවේදැයි ගණන් කරන්න. 10 න් 8 යනු 80% කි.", "எத்தனை முளைக்கின்றன என்று எண்ணுங்கள். 10 இல் 8 என்றால் 80%."),
            ],
            task: L("Test 10 seeds from your batch.", "ඔබේ කාණ්ඩයෙන් බීජ 10 ක් පරීක්ෂා කරන්න.", "உங்கள் தொகுதியிலிருந்து 10 விதைகளைச் சோதியுங்கள்."),
          },
          {
            icon: "🏷️",
            title: L("Label every packet", "සෑම පැකට්ටුවක්ම ලේබල් කරන්න", "ஒவ்வொரு பாக்கெட்டையும் லேபிளிடுங்கள்"),
            points: [
              L("Write the vegetable and its variety.", "එළවළුව සහ එහි ප්‍රභේදය ලියන්න.", "காய்கறியையும் அதன் வகையையும் எழுதுங்கள்."),
              L("Write the batch number and packing date.", "කාණ්ඩ අංකය සහ ඇසුරුම් දිනය ලියන්න.", "தொகுதி எண்ணையும் பொதி தேதியையும் எழுதுங்கள்."),
              L("Clear labels help buyers trust your seeds.", "පැහැදිලි ලේබල් ඔබේ බීජ විශ්වාස කිරීමට ගැනුම්කරුවන්ට උපකාරී වේ.", "தெளிவான லேபிள்கள் உங்கள் விதைகளை வாங்குபவர்கள் நம்ப உதவும்."),
            ],
            task: L("Label one packet properly.", "එක් පැකට්ටුවක් නිවැරදිව ලේබල් කරන්න.", "ஒரு பாக்கெட்டைச் சரியாக லேபிளிடுங்கள்."),
          },
          {
            icon: "📒",
            title: L("Keep records", "වාර්තා තබා ගන්න", "பதிவுகளை வைத்திருங்கள்"),
            points: [
              L("Note where each batch came from.", "සෑම කාණ්ඩයක්ම පැමිණියේ කොහෙන්දැයි සටහන් කරන්න.", "ஒவ்வொரு தொகுதியும் எங்கிருந்து வந்தது என்று குறியுங்கள்."),
              L("Write the result of each sprouting test.", "සෑම පැළවීමේ පරීක්ෂණයකම ප්‍රතිඵලය ලියන්න.", "ஒவ்வொரு முளைப்புச் சோதனையின் முடிவையும் எழுதுங்கள்."),
              L("Keep records for every batch you sell.", "ඔබ විකුණන සෑම කාණ්ඩයක් සඳහාම වාර්තා තබන්න.", "நீங்கள் விற்கும் ஒவ்வொரு தொகுதிக்கும் பதிவுகளை வையுங்கள்."),
            ],
            task: L("Start a seed record book.", "බීජ වාර්තා පොතක් අරඹන්න.", "விதைப் பதிவேடு தொடங்குங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("What does a sprouting test tell you?", "පැළවීමේ පරීක්ෂණයකින් ඔබට දැනගත හැක්කේ කුමක්ද?", "முளைப்புச் சோதனை உங்களுக்கு என்ன சொல்லும்?"),
            options: [L("How many seeds will sprout", "බීජ කීයක් පැළවේද", "எத்தனை விதைகள் முளைக்கும்"), L("How much the seeds weigh", "බීජවල බර කොපමණද", "விதைகளின் எடை எவ்வளவு"), L("What colour the fruit will be", "ගෙඩිවල වර්ණය කුමක්ද", "காயின் நிறம் என்ன")],
            answer: 0,
          },
          {
            question: L("8 out of 10 seeds sprout. What is the sprouting rate?", "බීජ 10 න් 8 ක් පැළවේ. පැළවීමේ අනුපාතය කුමක්ද?", "10 இல் 8 விதைகள் முளைக்கின்றன. முளைப்பு விகிதம் என்ன?"),
            options: [L("8%", "8%", "8%"), L("80%", "80%", "80%"), L("10%", "10%", "10%")],
            answer: 1,
          },
        ],
      },
    ],
    requirements: [
      L("Tell us where your seed comes from and which varieties you offer.", "ඔබේ බීජ පැමිණෙන්නේ කොහෙන්ද සහ ඔබ ලබා දෙන ප්‍රභේද මොනවාදැයි අපට කියන්න.", "உங்கள் விதைகள் எங்கிருந்து வருகின்றன, எந்த வகைகளை வழங்குகிறீர்கள் என்று எங்களிடம் சொல்லுங்கள்."),
      L("Send a sample batch for a germination test by the Aswedduma team.", "අස්වැද්දුම කණ්ඩායම විසින් පැළවීමේ පරීක්ෂණයක් සඳහා නියැදි කාණ්ඩයක් එවන්න.", "அஸ்வெத்தும குழுவின் முளைப்புச் சோதனைக்கு ஒரு மாதிரித் தொகுதியை அனுப்புங்கள்."),
      L("Label every packet with variety, batch and packing date.", "සෑම පැකට්ටුවක්ම ප්‍රභේදය, කාණ්ඩය සහ ඇසුරුම් දිනය සමඟ ලේබල් කරන්න.", "ஒவ்வொரு பாக்கெட்டிலும் வகை, தொகுதி, பொதி தேதியை லேபிளிடுங்கள்."),
    ],
  },

  // =====================================================================
  {
    id: "plantation",
    icon: "🍃",
    badgeLabel: "PLANTATION",
    colors: ["#2dd4bf", "#0f766e"],
    name: L("Aswedduma Certified Plantation", "අස්වැද්දුම සහතික වැවිල්ල", "அஸ்வெத்தும சான்றளிக்கப்பட்ட பெருந்தோட்டம்"),
    forWho: L(
      "Cinnamon and tea growers, from smallholders to estates.",
      "කුඩා ඉඩම් හිමියන්ගේ සිට වතු දක්වා කුරුඳු සහ තේ වගාකරුවන්.",
      "சிறு நில உரிமையாளர்கள் முதல் தோட்டங்கள் வரை கறுவா மற்றும் தேயிலை விவசாயிகள்."
    ),
    modules: [
      {
        id: "plan",
        icon: "📊",
        title: L("Plan your plantation", "ඔබේ වැවිල්ල සැලසුම් කරන්න", "உங்கள் பெருந்தோட்டத்தைத் திட்டமிடுங்கள்"),
        lessons: [
          {
            icon: "🧮",
            title: L("Know your numbers", "ඔබේ ගණන් දැනගන්න", "உங்கள் கணக்குகளை அறியுங்கள்"),
            points: [
              L("Work out the setup cost before you start.", "ආරම්භ කිරීමට පෙර සැකසුම් වියදම ගණනය කරන්න.", "தொடங்கும் முன் அமைப்புச் செலவைக் கணக்கிடுங்கள்."),
              L("Most crops take a few years before the first harvest.", "බොහෝ බෝගවලට පළමු අස්වැන්නට වසර කිහිපයක් ගතවේ.", "பெரும்பாலான பயிர்களுக்கு முதல் அறுவடைக்குச் சில ஆண்டுகள் ஆகும்."),
              L("Use the plantation calculator to see your costs and income.", "ඔබේ වියදම් සහ ආදායම බැලීමට වැවිලි ගණක යන්ත්‍රය භාවිතා කරන්න.", "உங்கள் செலவையும் வருமானத்தையும் காண பெருந்தோட்டக் கணிப்பானைப் பயன்படுத்துங்கள்."),
            ],
            task: L("Try the calculator with your land size.", "ඔබේ ඉඩමේ ප්‍රමාණය සමඟ ගණක යන්ත්‍රය උත්සාහ කරන්න.", "உங்கள் நில அளவுடன் கணிப்பானை முயற்சியுங்கள்."),
            href: "/plantation",
          },
          {
            icon: "📈",
            title: L("Payback and NPV", "ආපසු ලැබීම සහ NPV", "திருப்பிப் பெறுதலும் NPV யும்"),
            points: [
              L("The payback year is when your income has covered your costs.", "ආපසු ලැබෙන වසර යනු ඔබේ ආදායම ඔබේ වියදම් පියවූ වසරයි.", "திருப்பிப் பெறும் ஆண்டு என்பது உங்கள் வருமானம் செலவுகளை ஈடுகட்டிய ஆண்டு."),
              L("NPV is today's value of the money the crop will earn.", "NPV යනු බෝගය උපයන මුදලේ අද වටිනාකමයි.", "NPV என்பது பயிர் ஈட்டும் பணத்தின் இன்றைய மதிப்பு."),
              L("If NPV is above zero, the plan earns more than it costs.", "NPV ශුන්‍යයට වඩා වැඩි නම්, සැලැස්ම වියදමට වඩා වැඩියෙන් උපයයි.", "NPV பூஜ்ஜியத்திற்கு மேல் இருந்தால், திட்டம் செலவை விட அதிகம் ஈட்டும்."),
            ],
            task: L("Note the payback year for your plan.", "ඔබේ සැලැස්මේ ආපසු ලැබෙන වසර සටහන් කරන්න.", "உங்கள் திட்டத்தின் திருப்பிப் பெறும் ஆண்டைக் குறியுங்கள்."),
          },
          {
            icon: "🤝",
            title: L("Get expert advice", "විශේෂඥ උපදෙස් ලබා ගන්න", "நிபுணர் ஆலோசனை பெறுங்கள்"),
            points: [
              L("For tea, talk to the Tea Research Institute. For cinnamon, the Department of Export Agriculture.", "තේ සඳහා තේ පර්යේෂණ ආයතනය සමඟ කතා කරන්න. කුරුඳු සඳහා අපනයන කෘෂිකර්ම දෙපාර්තමේන්තුව.", "தேயிலைக்கு தேயிலை ஆராய்ச்சி நிறுவனத்துடன் பேசுங்கள். கறுவாவுக்கு ஏற்றுமதி விவசாயத் திணைக்களம்."),
              L("Ask which varieties grow best in your area.", "ඔබේ ප්‍රදේශයේ හොඳින්ම වැඩෙන ප්‍රභේද මොනවාදැයි අසන්න.", "உங்கள் பகுதியில் எந்த வகைகள் சிறப்பாக வளரும் என்று கேளுங்கள்."),
              L("Check prices with buyers before you plant.", "සිටුවීමට පෙර ගැනුම්කරුවන් සමඟ මිල පරීක්ෂා කරන්න.", "நடுவதற்கு முன் வாங்குபவர்களிடம் விலையைச் சரிபாருங்கள்."),
            ],
            task: L("Write a list of questions for an expert.", "විශේෂඥයෙකුගෙන් ඇසීමට ප්‍රශ්න ලැයිස්තුවක් ලියන්න.", "நிபுணரிடம் கேட்க கேள்விகளின் பட்டியலை எழுதுங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("What does NPV tell you?", "NPV ඔබට කියන්නේ කුමක්ද?", "NPV உங்களுக்கு என்ன சொல்கிறது?"),
            options: [L("Today's value of the money the crop will earn", "බෝගය උපයන මුදලේ අද වටිනාකම", "பயிர் ஈட்டும் பணத்தின் இன்றைய மதிப்பு"), L("The yield of one bush", "එක් පඳුරක අස්වැන්න", "ஒரு புதரின் விளைச்சல்"), L("The number of workers needed", "අවශ්‍ය කම්කරුවන් ගණන", "தேவையான தொழிலாளர்களின் எண்ணிக்கை")],
            answer: 0,
          },
          {
            question: L("What is the payback year?", "ආපසු ලැබෙන වසර කුමක්ද?", "திருப்பிப் பெறும் ஆண்டு என்பது என்ன?"),
            options: [L("The year you plant", "ඔබ සිටුවන වසර", "நீங்கள் நடும் ஆண்டு"), L("When income has covered the costs", "ආදායම වියදම් පියවූ විට", "வருமானம் செலவுகளை ஈடுகட்டியபோது"), L("The first harvest year", "පළමු අස්වනු වසර", "முதல் அறுவடை ஆண்டு")],
            answer: 1,
          },
        ],
      },
      {
        id: "prepare-plant",
        icon: "🌧️",
        title: L("Prepare and plant", "සූදානම් කර සිටුවන්න", "தயார் செய்து நடுங்கள்"),
        lessons: [
          {
            icon: "🧪",
            title: L("Test the land", "ඉඩම පරීක්ෂා කරන්න", "நிலத்தைச் சோதியுங்கள்"),
            points: [
              L("Test the soil pH before planting.", "සිටුවීමට පෙර පසේ pH පරීක්ෂා කරන්න.", "நடுவதற்கு முன் மண்ணின் pH ஐச் சோதியுங்கள்."),
              L("Cinnamon likes pH 5.0 to 6.5. Tea likes pH 4.5 to 5.5.", "කුරුඳු pH 5.0-6.5 ට කැමතියි. තේ pH 4.5-5.5 ට කැමතියි.", "கறுவாவுக்கு pH 5.0-6.5 பிடிக்கும். தேயிலைக்கு pH 4.5-5.5 பிடிக்கும்."),
              L("Avoid land that floods.", "ජලයෙන් යට වන ඉඩම් වළක්වන්න.", "வெள்ளம் வரும் நிலத்தைத் தவிர்க்கவும்."),
            ],
            task: L("Take a soil sample for testing.", "පරීක්ෂාව සඳහා පස් නියැදියක් ගන්න.", "சோதனைக்கு மண் மாதிரி எடுங்கள்."),
          },
          {
            icon: "⛰️",
            title: L("Protect the soil", "පස ආරක්ෂා කරන්න", "மண்ணைப் பாதுகாருங்கள்"),
            points: [
              L("On slopes, build drains across the slope.", "බෑවුම්වල, බෑවුම හරහා කාණු සාදන්න.", "சரிவுகளில், சரிவுக்குக் குறுக்கே வடிகால்களை அமையுங்கள்."),
              L("Cover the soil so rain does not wash it away.", "වැස්සෙන් පස සේදී නොයන සේ පස ආවරණය කරන්න.", "மழை மண்ணை அடித்துச் செல்லாமல் இருக்க மண்ணை மூடுங்கள்."),
              L("Plant shade trees for tea.", "තේ සඳහා සෙවන ගස් සිටුවන්න.", "தேயிலைக்கு நிழல் மரங்களை நடுங்கள்."),
            ],
            task: L("Walk your land after rain. See where water runs.", "වැස්සෙන් පසු ඔබේ ඉඩමේ ඇවිදින්න. වතුර ගලන තැන බලන්න.", "மழைக்குப் பிறகு உங்கள் நிலத்தில் நடங்கள். நீர் எங்கே ஓடுகிறது என்று பாருங்கள்."),
          },
          {
            icon: "🌧️",
            title: L("Plant at the right time", "නිවැරදි කාලයේ සිටුවන්න", "சரியான நேரத்தில் நடுங்கள்"),
            points: [
              L("Plant at the start of the rains.", "වැසි ආරම්භයේදී සිටුවන්න.", "மழை தொடங்கும்போது நடுங்கள்."),
              L("Use healthy plants of recommended varieties.", "නිර්දේශිත ප්‍රභේදවල නිරෝගී පැළ භාවිතා කරන්න.", "பரிந்துரைக்கப்பட்ட வகைகளின் ஆரோக்கியமான செடிகளைப் பயன்படுத்துங்கள்."),
              L("Mulch and protect young plants in dry weather.", "වියළි කාලයේ ළපටි පැළවලට වසුන් දමා ආරක්ෂා කරන්න.", "உலர் காலத்தில் இளம் செடிகளுக்கு மூடாக்கு இட்டுப் பாதுகாருங்கள்."),
            ],
            task: L("Mark the start of the next rains on your calendar.", "ඊළඟ වැසි ආරම්භය ඔබේ දින දර්ශනයේ සලකුණු කරන්න.", "அடுத்த மழை தொடக்கத்தை உங்கள் நாட்காட்டியில் குறியுங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("When is the best time to plant new cinnamon or tea?", "නව කුරුඳු හෝ තේ සිටුවීමට හොඳම කාලය කුමක්ද?", "புதிய கறுவா அல்லது தேயிலையை நட சிறந்த நேரம் எது?"),
            options: [L("In the middle of the dry season", "වියළි කාලයේ මැද", "உலர் பருவத்தின் நடுவில்"), L("At the start of the rains", "වැසි ආරම්භයේදී", "மழை தொடங்கும்போது"), L("It makes no difference", "වෙනසක් නැත", "வேறுபாடு இல்லை")],
            answer: 1,
          },
          {
            question: L("Why test the soil before planting?", "සිටුවීමට පෙර පස පරීක්ෂා කරන්නේ ඇයි?", "நடுவதற்கு முன் மண்ணை ஏன் சோதிக்க வேண்டும்?"),
            options: [L("To check its colour", "එහි වර්ණය බැලීමට", "அதன் நிறத்தைப் பார்க்க"), L("It is not needed", "එය අවශ්‍ය නැත", "அது தேவையில்லை"), L("To know its pH and what it needs", "එහි pH සහ අවශ්‍යතා දැන ගැනීමට", "அதன் pH மற்றும் தேவைகளை அறிய")],
            answer: 2,
          },
        ],
      },
      {
        id: "good-practice",
        icon: "📒",
        title: L("Good practice and records", "හොඳ පිළිවෙත් සහ වාර්තා", "நல்ல நடைமுறைகளும் பதிவுகளும்"),
        lessons: [
          {
            icon: "✂️",
            title: L("Care for the crop", "බෝගය රැක බලා ගන්න", "பயிரைப் பராமரியுங்கள்"),
            points: [
              L("Weed often, and feed as the experts advise.", "නිතර වල් නෙලන්න, විශේෂඥ උපදෙස් පරිදි පොහොර යොදන්න.", "அடிக்கடி களை எடுங்கள், நிபுணர்கள் அறிவுறுத்தியபடி உரமிடுங்கள்."),
              L("Prune and shape the bushes for a good harvest.", "හොඳ අස්වැන්නක් සඳහා පඳුරු කප්පාදු කර හැඩගස්වන්න.", "நல்ல அறுவடைக்குப் புதர்களைக் கத்தரித்து வடிவமையுங்கள்."),
              L("Harvest at the right time for the best quality.", "හොඳම ගුණාත්මකභාවය සඳහා නිවැරදි කාලයේ අස්වනු නෙළන්න.", "சிறந்த தரத்திற்குச் சரியான நேரத்தில் அறுவடை செய்யுங்கள்."),
            ],
            task: L("Make a monthly care calendar.", "මාසික රැකවරණ දින දර්ශනයක් සාදන්න.", "மாதாந்திரப் பராமரிப்பு நாட்காட்டி தயாரியுங்கள்."),
          },
          {
            icon: "👷",
            title: L("Workers and safety", "කම්කරුවන් සහ ආරක්ෂාව", "தொழிலாளர்களும் பாதுகாப்பும்"),
            points: [
              L("Train workers to use tools and sprays safely.", "මෙවලම් සහ ඉසීම් ආරක්ෂිතව භාවිතා කිරීමට කම්කරුවන් පුහුණු කරන්න.", "கருவிகளையும் தெளிப்புகளையும் பாதுகாப்பாகப் பயன்படுத்தத் தொழிலாளர்களுக்குப் பயிற்சி அளியுங்கள்."),
              L("Give gloves and covering clothes for spraying.", "ඉසීම සඳහා අත්වැසුම් සහ ආවරණ ඇඳුම් ලබා දෙන්න.", "தெளிப்பதற்குக் கையுறைகளும் மூடும் ஆடைகளும் கொடுங்கள்."),
              L("Keep chemicals locked away from children.", "රසායන ද්‍රව්‍ය ළමයින්ගෙන් ඈත්ව අගුළු දමා තබන්න.", "இரசாயனங்களைக் குழந்தைகளிடமிருந்து பூட்டி வையுங்கள்."),
            ],
            task: L("Check you have gloves and masks for spraying.", "ඉසීම සඳහා අත්වැසුම් සහ මුහුණු ආවරණ ඇත්දැයි පරීක්ෂා කරන්න.", "தெளிப்பதற்குக் கையுறைகளும் முகக்கவசங்களும் உள்ளதா எனப் பாருங்கள்."),
          },
          {
            icon: "📒",
            title: L("Keep records", "වාර්තා තබා ගන්න", "பதிவுகளை வைத்திருங்கள்"),
            points: [
              L("Write down inputs, sprays, workers and harvests.", "යෙදවුම්, ඉසීම්, කම්කරුවන් සහ අස්වනු ලියා තබන්න.", "இடுபொருட்கள், தெளிப்புகள், தொழிலாளர்கள், அறுவடைகளை எழுதுங்கள்."),
              L("Records show buyers where your crop comes from.", "වාර්තා ඔබේ බෝගය පැමිණෙන තැන ගැනුම්කරුවන්ට පෙන්වයි.", "உங்கள் பயிர் எங்கிருந்து வருகிறது என்பதைப் பதிவுகள் வாங்குபவர்களுக்குக் காட்டும்."),
              L("They also show you what makes a profit.", "ලාභය ලැබෙන්නේ කුමකින්දැයි ඒවා ඔබටද පෙන්වයි.", "எது லாபம் தருகிறது என்பதையும் அவை உங்களுக்குக் காட்டும்."),
            ],
            task: L("Start a field record book.", "ක්ෂේත්‍ර වාර්තා පොතක් අරඹන්න.", "களப் பதிவேடு தொடங்குங்கள்."),
          },
        ],
        quiz: [
          {
            question: L("Why keep records?", "වාර්තා තබා ගන්නේ ඇයි?", "ஏன் பதிவுகளை வைத்திருக்க வேண்டும்?"),
            options: [L("They are not needed", "ඒවා අවශ්‍ය නැත", "அவை தேவையில்லை"), L("So buyers can trust where the crop comes from", "බෝගය පැමිණෙන තැන ගැනුම්කරුවන්ට විශ්වාස කළ හැකි වීමට", "பயிர் எங்கிருந்து வருகிறது என்று வாங்குபவர்கள் நம்ப"), L("Only for the tax office", "බදු කාර්යාලයට පමණි", "வரி அலுவலகத்திற்கு மட்டும்")],
            answer: 1,
          },
          {
            question: L("What should workers wear when spraying?", "ඉසීමේදී කම්කරුවන් ඇඳිය යුත්තේ කුමක්ද?", "தெளிக்கும்போது தொழிலாளர்கள் என்ன அணிய வேண்டும்?"),
            options: [L("Gloves and covering clothes", "අත්වැසුම් සහ ආවරණ ඇඳුම්", "கையுறைகளும் மூடும் ஆடைகளும்"), L("Normal clothes", "සාමාන්‍ය ඇඳුම්", "சாதாரண ஆடைகள்"), L("Nothing special", "විශේෂ දෙයක් නැත", "சிறப்பாக எதுவும் இல்லை")],
            answer: 0,
          },
        ],
      },
    ],
    requirements: [
      L("Share your land size, location and crop.", "ඔබේ ඉඩමේ ප්‍රමාණය, ස්ථානය සහ බෝගය බෙදාගන්න.", "உங்கள் நில அளவு, இடம், பயிரைப் பகிருங்கள்."),
      L("Welcome a field visit from the Aswedduma team.", "අස්වැද්දුම කණ්ඩායමේ ක්ෂේත්‍ර නිරීක්ෂණයක් සඳහා අවසර දෙන්න.", "அஸ்வெத்தும குழுவின் கள வருகையை வரவேற்கவும்."),
      L("Keep input and harvest records for one season.", "එක් කන්නයක් සඳහා යෙදවුම් සහ අස්වනු වාර්තා තබා ගන්න.", "ஒரு பருவத்திற்கு இடுபொருள் மற்றும் அறுவடைப் பதிவுகளை வைத்திருங்கள்."),
    ],
  },
];

export function getTrack(id: string): CertTrack | undefined {
  return CERT_TRACKS.find((track) => track.id === id);
}

/** Every lesson in a course, counted for progress */
export function lessonCount(track: CertTrack): number {
  return track.modules.reduce((sum, module) => sum + module.lessons.length, 0);
}
