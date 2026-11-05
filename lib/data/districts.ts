/**
 * ==== DISTRICT SUITABILITY (SRS 3.14, PLACEHOLDERS, OI-19) ====
 *
 * How well each plantation crop suits each of Sri Lanka's 25 districts, as a
 * broad guide from climate zone, rainfall and elevation. Conditions change
 * within a district, so this is a first check, not advice: confirm with the
 * Department of Export Agriculture (cinnamon) or the Tea Research Institute
 * and Tea Small Holdings Development Authority (tea). English only (OI-20).
 */
import type { CropId } from "./plantation";

export const DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
] as const;

export type District = (typeof DISTRICTS)[number];

export function isDistrict(value: unknown): value is District {
  return typeof value === "string" && (DISTRICTS as readonly string[]).includes(value);
}

export type Rating = "suitable" | "moderate" | "marginal" | "unsuitable";

export const RATINGS: Record<Rating, { label: string; yieldFactor: number }> = {
  suitable: { label: "Good fit", yieldFactor: 1 },
  moderate: { label: "Possible, with care", yieldFactor: 0.75 },
  marginal: { label: "Risky", yieldFactor: 0.4 },
  unsuitable: { label: "Not viable", yieldFactor: 0 },
};

export type Suitability = { rating: Rating; reason: string };

// The usual reason for each rating, unless a district has its own below
const REASONS: Record<CropId, Record<Rating, string>> = {
  cinnamon: {
    suitable:
      "Wet-zone lowland with steady rain, where most Ceylon cinnamon is grown. The bark peels well for most of the year.",
    moderate:
      "Intermediate zone or hilly land: cinnamon grows on the lower, wetter parts, but expect smaller harvests than on the south-west coast.",
    marginal:
      "Dry zone: the long dry season makes the bark hard to peel and young plants need watering. Only worth trying on wetter land with a reliable water supply.",
    unsuitable:
      "Cinnamon needs warm lowland with about 1,750 to 2,500 mm of rain spread through the year. This district does not have that.",
  },
  tea: {
    suitable:
      "Wet zone with steady rain and acidic soil: proven tea land, with registered factories nearby to buy green leaf.",
    moderate:
      "Some tea is grown here, mostly on the wetter or higher land. Check the rainfall, soil pH (4.5 to 5.5) and the distance to a tea factory first.",
    marginal:
      "Mostly too dry for tea. Only small wetter pockets suit it, and yields there are uncertain.",
    unsuitable:
      "Tea needs at least about 1,500 mm of well-spread rain and acidic soil. The long droughts here make tea not viable.",
  },
};

const CINNAMON: Record<District, Rating> = {
  Galle: "suitable",
  Matara: "suitable",
  Kalutara: "suitable",
  Hambantota: "suitable",
  Ratnapura: "suitable",
  Colombo: "suitable",
  Gampaha: "suitable",
  Kegalle: "suitable",
  Kurunegala: "moderate",
  Monaragala: "moderate",
  Matale: "moderate",
  Kandy: "moderate",
  Badulla: "moderate",
  Puttalam: "moderate",
  Ampara: "marginal",
  Batticaloa: "marginal",
  Trincomalee: "marginal",
  Polonnaruwa: "marginal",
  Anuradhapura: "marginal",
  Vavuniya: "marginal",
  Mullaitivu: "marginal",
  Kilinochchi: "marginal",
  "Nuwara Eliya": "unsuitable",
  Jaffna: "unsuitable",
  Mannar: "unsuitable",
};

const TEA: Record<District, Rating> = {
  "Nuwara Eliya": "suitable",
  Badulla: "suitable",
  Kandy: "suitable",
  Ratnapura: "suitable",
  Galle: "suitable",
  Matara: "suitable",
  Kegalle: "suitable",
  Kalutara: "suitable",
  Matale: "moderate",
  Hambantota: "moderate",
  Monaragala: "moderate",
  Colombo: "moderate",
  Gampaha: "moderate",
  Kurunegala: "marginal",
  Ampara: "marginal",
  Puttalam: "unsuitable",
  Anuradhapura: "unsuitable",
  Polonnaruwa: "unsuitable",
  Trincomalee: "unsuitable",
  Batticaloa: "unsuitable",
  Vavuniya: "unsuitable",
  Mullaitivu: "unsuitable",
  Kilinochchi: "unsuitable",
  Mannar: "unsuitable",
  Jaffna: "unsuitable",
};

// Where a district needs its own explanation
const DISTRICT_REASONS: Partial<Record<CropId, Partial<Record<District, string>>>> = {
  cinnamon: {
    "Nuwara Eliya":
      "Too high and too cold. Cinnamon grows best below about 500 m, and most of Nuwara Eliya lies above 1,000 m, much of it above 1,800 m. The plants grow slowly, the bark does not form well and frost can kill young plants.",
    Jaffna:
      "Too dry. Jaffna gets far less rain than cinnamon needs and has a long dry season, with salty ground water near the coast.",
    Mannar:
      "Too dry. Mannar is in the arid zone, with far less rain than cinnamon needs and salty soils near the coast.",
    Hambantota:
      "One of the biggest cinnamon districts today, mostly in its wetter western and northern parts. The drier east is less suited.",
    Kandy:
      "Grows on the lower, warmer land of the district. Higher ground is too cool for good bark.",
    Badulla:
      "Only the lower, warmer parts of the district suit cinnamon; the hill country is too cool.",
  },
  tea: {
    "Nuwara Eliya":
      "The heart of high-grown tea. Yields per hectare are lower than low-grown tea, but the leaf fetches the best prices.",
    Colombo:
      "Low, wet land where tea can grow, but land is costly and mostly built up, and tea factories are far away.",
    Gampaha:
      "Low, wet land where tea can grow, but land is costly and tea factories are far away.",
    Hambantota:
      "Tea grows only in the wetter north-western parts, next to Ratnapura and Matara. Most of the district is too dry.",
  },
};

const RATINGS_BY_CROP: Record<CropId, Record<District, Rating>> = { cinnamon: CINNAMON, tea: TEA };

export function suitability(crop: CropId, district: District): Suitability {
  const rating = RATINGS_BY_CROP[crop][district];
  return { rating, reason: DISTRICT_REASONS[crop]?.[district] ?? REASONS[crop][rating] };
}

/** The districts where a crop is a good fit, for suggesting somewhere better */
export function bestDistricts(crop: CropId): District[] {
  return DISTRICTS.filter((district) => RATINGS_BY_CROP[crop][district] === "suitable");
}

/** A crop that suits this district better, if there is one */
export function betterCrop(crop: CropId, district: District): CropId | null {
  const order: Rating[] = ["suitable", "moderate", "marginal", "unsuitable"];
  const mine = order.indexOf(RATINGS_BY_CROP[crop][district]);
  const other: CropId = crop === "cinnamon" ? "tea" : "cinnamon";
  return order.indexOf(RATINGS_BY_CROP[other][district]) < mine ? other : null;
}
