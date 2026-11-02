/**
 * ==== PLANTATION ASSUMPTIONS (SRS 3.14) ====
 *
 * PLACEHOLDERS ONLY. None of these figures has been validated; they must be
 * checked with the Sri Lanka Tea Board, the Export Development Board, the Tea
 * Research Institute, an agronomist and an accountant before anyone relies
 * on them (OI-19). English only until translated (OI-20).
 */

export type CropId = "cinnamon" | "tea";

export type PlantationAssumptions = {
  /** LKR per hectare, paid in year 0 */
  setupCost: number;
  /** LKR per hectare per year, before the first harvest year */
  upkeepBefore: number;
  /** LKR per hectare per year, from the first harvest year on */
  upkeepAfter: number;
  /** Saleable kg per hectare per year at full production */
  yieldKg: number;
  /** LKR per kg */
  price: number;
  /** Year of the first (half) harvest */
  firstHarvestYear: number;
  workersPerHa: number;
};

export type Crop = {
  id: CropId;
  name: string;
  icon: string;
  product: string;
  defaults: PlantationAssumptions;
  steps: { title: string; text: string }[];
};

export const HECTARE_IN_ACRES = 2.47;
export const DEFAULT_DISCOUNT_RATE = 0.12;
export const DEFAULT_YEARS = 15;
export const MIN_YEARS = 5;
export const MAX_YEARS = 40;

export const CROPS: Crop[] = [
  {
    id: "cinnamon",
    name: "Cinnamon (Ceylon)",
    icon: "🪵",
    product: "cinnamon quills",
    defaults: {
      setupCost: 1_200_000,
      upkeepBefore: 300_000,
      upkeepAfter: 900_000,
      yieldKg: 600,
      price: 3_500,
      firstHarvestYear: 3,
      workersPerHa: 2.5,
    },
    steps: [
      {
        title: "Choose and test the land",
        text: "Cinnamon grows best in the wet and intermediate zones below 500 m, on well-drained sandy loam. Test the soil pH (aim for 5.0 to 6.5) and avoid land that floods.",
      },
      {
        title: "Clear and prepare",
        text: "Clear weeds and scrub, build contour drains on slopes, and mark planting holes about 1.2 m x 0.6 m apart. Add compost to each hole a few weeks before planting.",
      },
      {
        title: "Plant at the start of the rains",
        text: "Plant healthy nursery seedlings of a recommended variety when the monsoon begins, so they establish without irrigation. Shade young plants for the first months.",
      },
      {
        title: "Weed, feed and shape",
        text: "Weed regularly, mulch, and apply fertilizer as advised by the Department of Export Agriculture. Cut back the young plants to encourage many straight shoots from the base.",
      },
      {
        title: "First harvest",
        text: "From about the third year, cut mature shoots in the wet season when the bark peels easily. Leave enough shoots on each bush to regrow.",
      },
      {
        title: "Peel, dry and sell",
        text: "Skilled peelers make quills on the same day as cutting. Dry them in shade, grade them (Alba, C5, C4, H1 and others) and sell to registered buyers or exporters.",
      },
    ],
  },
  {
    id: "tea",
    name: "Tea (Ceylon)",
    icon: "🍃",
    product: "green leaf",
    defaults: {
      setupCost: 3_500_000,
      upkeepBefore: 400_000,
      upkeepAfter: 1_100_000,
      yieldKg: 8_000,
      price: 220,
      firstHarvestYear: 3,
      workersPerHa: 2.5,
    },
    steps: [
      {
        title: "Choose and test the land",
        text: "Tea needs acidic soil (pH 4.5 to 5.5), good drainage and steady rainfall. Check the elevation zone (low, mid or up country) because it sets the price your leaf earns.",
      },
      {
        title: "Prepare the land",
        text: "Clear the land, build terraces or contour drains on slopes, plant shade trees and windbreaks, and mark planting rows as recommended by the Tea Research Institute.",
      },
      {
        title: "Plant clonal tea",
        text: "Plant vegetatively propagated (VP) clones suited to your elevation at the start of the rains. Mulch well and protect young plants from drought.",
      },
      {
        title: "Bring the bushes into bearing",
        text: "Centre, prune and tip the young bushes to build a wide, flat plucking table. Weed and fertilize on the TRI schedule.",
      },
      {
        title: "Start plucking",
        text: "From about the third year, pluck two leaves and a bud every 7 to 10 days. Regular, fine plucking gives better leaf and a better price.",
      },
      {
        title: "Sell green leaf",
        text: "Deliver fresh leaf the same day to a registered tea factory or leaf collector. Keep records for the Tea Small Holdings Development Authority and plan pruning every few years.",
      },
    ],
  },
];
