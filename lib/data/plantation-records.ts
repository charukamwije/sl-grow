/**
 * ==== PLANTATION MANAGER CHOICES ====
 *
 * The lists a planter picks from when recording their plantation. Stored by
 * value, so a label can be reworded without touching saved records. English
 * only, like the rest of the Plantation section (OI-20).
 */

export const PLANTATION_CROPS = ["cinnamon", "tea"] as const;

export type PlantationCrop = (typeof PLANTATION_CROPS)[number];

export type Choice = { value: string; label: string };

export const AREA_UNITS = ["acres", "ha"] as const;

export type AreaUnit = (typeof AREA_UNITS)[number];

export const AREA_UNIT_CHOICES: Choice[] = [
  { value: "acres", label: "Acres" },
  { value: "ha", label: "Hectares" },
];

/** By definition: one acre is 0.40468564224 hectares */
export const ACRE_IN_HA = 0.40468564224;

export function toHectares(area: number, unit: AreaUnit): number {
  return unit === "acres" ? area * ACRE_IN_HA : area;
}

const AREA_SHORT: Record<AreaUnit, [string, string]> = { acres: ["acre", "acres"], ha: ["ha", "ha"] };

/** "5 acres", "1 acre", "2.5 ha" */
export function areaLabel(area: number, unit: AreaUnit, format: (n: number) => string): string {
  return `${format(area)} ${AREA_SHORT[unit][area === 1 ? 0 : 1]}`;
}

export const CROP_LABELS: Record<PlantationCrop, string> = {
  cinnamon: "Ceylon cinnamon",
  tea: "Tea",
};

/** What a harvest yields, per crop */
export const HARVEST_PRODUCTS: Record<PlantationCrop, Choice[]> = {
  tea: [
    { value: "green_leaf", label: "Green leaf" },
    { value: "made_tea", label: "Made tea" },
  ],
  cinnamon: [
    { value: "quills", label: "Quills" },
    { value: "quillings", label: "Quillings" },
    { value: "featherings", label: "Featherings" },
    { value: "chips", label: "Chips" },
    { value: "leaf", label: "Leaves (for oil)" },
  ],
};

export const INCOME_CATEGORIES: Record<PlantationCrop, Choice[]> = {
  tea: [
    { value: "leaf_sales", label: "Green leaf sales" },
    { value: "made_tea_sales", label: "Made tea sales" },
    { value: "subsidy", label: "Subsidy or grant" },
    { value: "other_income", label: "Other income" },
  ],
  cinnamon: [
    { value: "cinnamon_sales", label: "Cinnamon sales" },
    { value: "oil_sales", label: "Leaf oil sales" },
    { value: "subsidy", label: "Subsidy or grant" },
    { value: "other_income", label: "Other income" },
  ],
};

export const EXPENSE_CATEGORIES: Choice[] = [
  { value: "fertilizer", label: "Fertilizer" },
  { value: "agrochemicals", label: "Weedicide and pesticide" },
  { value: "planting_material", label: "Planting material" },
  { value: "contract_labour", label: "Contract labour" },
  { value: "transport", label: "Transport" },
  { value: "processing", label: "Processing" },
  { value: "equipment", label: "Tools and equipment" },
  { value: "land", label: "Land, lease and tax" },
  { value: "other_expense", label: "Other" },
];

export const ACTIVITY_TYPES: Record<PlantationCrop, Choice[]> = {
  tea: [
    { value: "plucking_round", label: "Plucking round" },
    { value: "fertilizing", label: "Fertilizing" },
    { value: "weeding", label: "Weeding" },
    { value: "pruning", label: "Pruning" },
    { value: "pest_control", label: "Pest and disease control" },
    { value: "infilling", label: "Infilling and replanting" },
    { value: "soil_conservation", label: "Soil conservation and drains" },
    { value: "other", label: "Other" },
  ],
  cinnamon: [
    { value: "peeling", label: "Harvesting and peeling" },
    { value: "fertilizing", label: "Fertilizing" },
    { value: "weeding", label: "Weeding" },
    { value: "pruning", label: "Pruning and coppicing" },
    { value: "pest_control", label: "Pest and disease control" },
    { value: "replanting", label: "Replanting" },
    { value: "soil_conservation", label: "Soil conservation" },
    { value: "other", label: "Other" },
  ],
};

export const WORK_TASKS: Record<PlantationCrop, Choice[]> = {
  tea: [
    { value: "plucking", label: "Plucking" },
    { value: "weeding", label: "Weeding" },
    { value: "fertilizing", label: "Fertilizing" },
    { value: "pruning", label: "Pruning" },
    { value: "other", label: "Other" },
  ],
  cinnamon: [
    { value: "harvesting", label: "Cutting" },
    { value: "peeling", label: "Peeling" },
    { value: "weeding", label: "Weeding" },
    { value: "fertilizing", label: "Fertilizing" },
    { value: "other", label: "Other" },
  ],
};

/**
 * ==== EXPECTED HARVEST (PLACEHOLDERS, OI-19) ====
 *
 * What the "expected" harvest is measured in, and how a year's harvest
 * usually spreads over the months in Sri Lanka. The yearly yield comes from
 * the calculator's assumptions (lib/data/plantation.ts). Rough guides only,
 * to be checked with the Tea Research Institute and the Department of Export
 * Agriculture.
 */
export const EXPECTED_UNIT: Record<PlantationCrop, string> = {
  tea: "green leaf",
  cinnamon: "dry bark",
};

/**
 * Kg of each harvest product counted towards the expected harvest, per kg
 * recorded. Made tea counts as the green leaf it was made from (about 4.5 kg
 * a kg); cinnamon leaves for oil are not bark, so they do not count.
 */
export const EXPECTED_FACTOR: Record<PlantationCrop, Record<string, number>> = {
  tea: { green_leaf: 1, made_tea: 4.5 },
  cinnamon: { quills: 1, quillings: 1, featherings: 1, chips: 1, leaf: 0 },
};

/** Share of a year's harvest in each month, January first; each adds up to 1 */
export const MONTHLY_SHARE: Record<PlantationCrop, number[]> = {
  // Flushes in March to May and October to December, slower in the dry months
  tea: [0.07, 0.07, 0.09, 0.1, 0.1, 0.08, 0.07, 0.07, 0.08, 0.09, 0.09, 0.09],
  // Main peeling season with the south-west monsoon (May to August), a
  // smaller one with the north-east monsoon (October to January)
  cinnamon: [0.05, 0, 0, 0.02, 0.14, 0.17, 0.17, 0.14, 0.06, 0.09, 0.1, 0.06],
};

export function choiceLabel(choices: Choice[], value: string): string {
  return choices.find((choice) => choice.value === value)?.label ?? value;
}
