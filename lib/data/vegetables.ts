/**
 * ==== VEGETABLE PLANNING DATA (SRS 4.2) ====
 *
 * Edit prices, yields and timings here; no logic depends on the order or on
 * any particular value. All figures are estimates until confirmed with local
 * growers (OI-01). Sinhala and Tamil text awaits translator review (OI-05).
 */
import type { Localized } from "../i18n/types";

export type Vegetable = {
  id: string;
  name: Localized;
  health: Localized;
  /** Default market price, LKR per kg */
  price: number;
  /** Default weekly consumption per person, grams */
  gramsPerWeek: number;
  /** Harvest per plant per cycle, kg */
  yieldPerCycle: number;
  /** Planting-to-harvest periods per year */
  cyclesPerYear: number;
  /** Growing space per plant, sq ft */
  spacePerPlant: number;
  daysToHarvest: number;
  climbing: boolean;
};

export const VEGETABLES: Vegetable[] = [
  {
    id: "tomato",
    name: { en: "Tomato", si: "තක්කාලි", ta: "தக்காளி" },
    health: {
      en: "Rich in vitamin C and lycopene, which supports heart health.",
      si: "විටමින් C සහ හෘද සෞඛ්‍යයට උපකාරී ලයිකොපීන් බහුලයි.",
      ta: "வைட்டமின் C மற்றும் இதய ஆரோக்கியத்திற்கு உதவும் லைகோபீன் நிறைந்தது.",
    },
    price: 400,
    gramsPerWeek: 150,
    yieldPerCycle: 3,
    cyclesPerYear: 2,
    spacePerPlant: 2,
    daysToHarvest: 75,
    climbing: false,
  },
  {
    id: "chili",
    name: { en: "Green chili", si: "අමු මිරිස්", ta: "பச்சை மிளகாய்" },
    health: {
      en: "High in vitamin C; adds flavour so less salt is needed.",
      si: "විටමින් C බහුලයි; රසය එක් කරන නිසා අඩු ලුණු ප්‍රමාණයක් ප්‍රමාණවත්.",
      ta: "வைட்டமின் C அதிகம்; சுவை தருவதால் குறைந்த உப்பு போதும்.",
    },
    price: 800,
    gramsPerWeek: 50,
    yieldPerCycle: 0.8,
    cyclesPerYear: 2,
    spacePerPlant: 1.5,
    daysToHarvest: 80,
    climbing: false,
  },
  {
    id: "brinjal",
    name: { en: "Brinjal", si: "වම්බටු", ta: "கத்தரிக்காய்" },
    health: {
      en: "A good source of fibre and antioxidants, low in calories.",
      si: "කෙඳි සහ ප්‍රතිඔක්සිකාරක හොඳින් ඇති, කැලරි අඩු එළවළුවකි.",
      ta: "நார்ச்சத்து மற்றும் ஆக்ஸிஜனேற்றிகள் நிறைந்தது, கலோரி குறைவு.",
    },
    price: 350,
    gramsPerWeek: 150,
    yieldPerCycle: 4,
    cyclesPerYear: 1,
    spacePerPlant: 2.5,
    daysToHarvest: 70,
    climbing: false,
  },
  {
    id: "okra",
    name: { en: "Okra", si: "බණ්ඩක්කා", ta: "வெண்டைக்காய்" },
    health: {
      en: "Contains soluble fibre that helps digestion and blood sugar control.",
      si: "ජීර්ණයට සහ රුධිර සීනි පාලනයට උපකාරී ද්‍රාව්‍ය කෙඳි අඩංගුයි.",
      ta: "செரிமானத்திற்கும் இரத்த சர்க்கரை கட்டுப்பாட்டிற்கும் உதவும் நார்ச்சத்து உள்ளது.",
    },
    price: 400,
    gramsPerWeek: 100,
    yieldPerCycle: 1,
    cyclesPerYear: 2,
    spacePerPlant: 1.5,
    daysToHarvest: 50,
    climbing: false,
  },
  {
    id: "longbean",
    name: { en: "Long bean", si: "මෑ කරල්", ta: "பயிற்றங்காய்" },
    health: {
      en: "Provides plant protein, folate and fibre.",
      si: "ශාක ප්‍රෝටීන්, ෆෝලේට් සහ කෙඳි ලබා දෙයි.",
      ta: "தாவர புரதம், ஃபோலேட் மற்றும் நார்ச்சத்து தருகிறது.",
    },
    price: 450,
    gramsPerWeek: 100,
    yieldPerCycle: 1,
    cyclesPerYear: 3,
    spacePerPlant: 1,
    daysToHarvest: 60,
    climbing: true,
  },
  {
    id: "bittergourd",
    name: { en: "Bitter gourd", si: "කරවිල", ta: "பாகற்காய்" },
    health: {
      en: "Traditionally eaten to help manage blood sugar; rich in vitamin C.",
      si: "රුධිර සීනි පාලනයට සාම්ප්‍රදායිකව ආහාරයට ගනී; විටමින් C බහුලයි.",
      ta: "இரத்த சர்க்கரையை கட்டுப்படுத்த பாரம்பரியமாக உண்ணப்படுகிறது; வைட்டமின் C நிறைந்தது.",
    },
    price: 500,
    gramsPerWeek: 75,
    yieldPerCycle: 2,
    cyclesPerYear: 2,
    spacePerPlant: 3,
    daysToHarvest: 65,
    climbing: true,
  },
  {
    id: "snakegourd",
    name: { en: "Snake gourd", si: "පතෝල", ta: "புடலங்காய்" },
    health: {
      en: "Very low in calories and high in water; good for hydration.",
      si: "කැලරි ඉතා අඩු, ජලය බහුල; ශරීරයට ජලය සපයයි.",
      ta: "கலோரி மிகக் குறைவு, நீர்ச்சத்து அதிகம்; உடல் நீரேற்றத்திற்கு நல்லது.",
    },
    price: 300,
    gramsPerWeek: 100,
    yieldPerCycle: 4,
    cyclesPerYear: 2,
    spacePerPlant: 4,
    daysToHarvest: 70,
    climbing: true,
  },
  {
    id: "cucumber",
    name: { en: "Cucumber", si: "පිපිඤ්ඤා", ta: "வெள்ளரிக்காய்" },
    health: {
      en: "Mostly water, cooling in hot weather, with some vitamin K.",
      si: "බොහෝ දුරට ජලය; උණුසුම් කාලයේ සිසිලස ලබා දෙයි, විටමින් K අඩංගුයි.",
      ta: "பெரும்பாலும் நீர்; வெப்ப காலத்தில் குளிர்ச்சி தரும், வைட்டமின் K உள்ளது.",
    },
    price: 300,
    gramsPerWeek: 100,
    yieldPerCycle: 3,
    cyclesPerYear: 3,
    spacePerPlant: 3,
    daysToHarvest: 50,
    climbing: true,
  },
  {
    id: "capsicum",
    name: { en: "Capsicum", si: "මාළු මිරිස්", ta: "குடைமிளகாய்" },
    health: {
      en: "One of the richest sources of vitamin C; also vitamin A.",
      si: "විටමින් C බහුලම ප්‍රභවයකි; විටමින් A ද අඩංගුයි.",
      ta: "வைட்டமின் C மிக அதிகமுள்ள காய்களில் ஒன்று; வைட்டமின் A உம் உள்ளது.",
    },
    price: 900,
    gramsPerWeek: 50,
    yieldPerCycle: 1,
    cyclesPerYear: 2,
    spacePerPlant: 1.5,
    daysToHarvest: 80,
    climbing: false,
  },
  {
    id: "kankun",
    name: { en: "Kankun", si: "කංකුං", ta: "வள்ளல் கீரை" },
    health: {
      en: "A leafy green with iron, calcium and vitamin A.",
      si: "යකඩ, කැල්සියම් සහ විටමින් A ඇති කොළ එළවළුවකි.",
      ta: "இரும்பு, கால்சியம் மற்றும் வைட்டமின் A உள்ள கீரை.",
    },
    price: 300,
    gramsPerWeek: 100,
    yieldPerCycle: 0.2,
    cyclesPerYear: 12,
    spacePerPlant: 0.5,
    daysToHarvest: 30,
    climbing: false,
  },
  {
    id: "gotukola",
    name: { en: "Gotukola", si: "ගොටුකොළ", ta: "வல்லாரை" },
    health: {
      en: "A traditional leafy green, often eaten as mallum; contains antioxidants.",
      si: "මැල්ලුමක් ලෙස බොහෝ විට ගන්නා සාම්ප්‍රදායික කොළ වර්ගයකි; ප්‍රතිඔක්සිකාරක අඩංගුයි.",
      ta: "பாரம்பரிய கீரை, பெரும்பாலும் சம்பலாக உண்ணப்படுகிறது; ஆக்ஸிஜனேற்றிகள் உள்ளன.",
    },
    price: 600,
    gramsPerWeek: 50,
    yieldPerCycle: 0.1,
    cyclesPerYear: 12,
    spacePerPlant: 0.5,
    daysToHarvest: 45,
    climbing: false,
  },
];
