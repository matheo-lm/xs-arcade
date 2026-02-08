export type FruitTierId =
  | "cherry"
  | "lemon"
  | "kiwi"
  | "orange"
  | "apple"
  | "pear"
  | "peach"
  | "melon"
  | "watermelon"
  | "pumpkin";

export interface FruitTier {
  id: FruitTierId;
  name: string;
  label: string;
  r: number;
  points: number;
  spriteUrl: string;
  fallbackSpriteUrl: string;
  fallbackA: string;
  fallbackB: string;
  special?: "pumpkin";
  drawScale: number;
  spriteScale: number;
}

export const FRUIT_TIERS: FruitTier[] = [
  {
    id: "cherry",
    name: "Cherry",
    label: "CH",
    r: 18,
    points: 10,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F352.svg",
    fallbackSpriteUrl: "/assets/fruits/cherry.svg",
    fallbackA: "#ff8a9a",
    fallbackB: "#ff2e50",
    drawScale: 1.02,
    spriteScale: 1.1
  },
  {
    id: "lemon",
    name: "Lemon",
    label: "LE",
    r: 23,
    points: 20,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F34B.svg",
    fallbackSpriteUrl: "/assets/fruits/lemon.svg",
    fallbackA: "#fff08a",
    fallbackB: "#ffc738",
    drawScale: 1,
    spriteScale: 1.1
  },
  {
    id: "kiwi",
    name: "Kiwi",
    label: "KI",
    r: 28,
    points: 40,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F95D.svg",
    fallbackSpriteUrl: "/assets/fruits/kiwi.svg",
    fallbackA: "#cde87e",
    fallbackB: "#7bb24a",
    drawScale: 1,
    spriteScale: 1.08
  },
  {
    id: "orange",
    name: "Orange",
    label: "OR",
    r: 34,
    points: 80,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F34A.svg",
    fallbackSpriteUrl: "/assets/fruits/orange.svg",
    fallbackA: "#ffd390",
    fallbackB: "#ff922f",
    drawScale: 1,
    spriteScale: 1.08
  },
  {
    id: "apple",
    name: "Apple",
    label: "AP",
    r: 41,
    points: 160,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F34E.svg",
    fallbackSpriteUrl: "/assets/fruits/apple.svg",
    fallbackA: "#ffb39f",
    fallbackB: "#ff3f3f",
    drawScale: 1,
    spriteScale: 1.08
  },
  {
    id: "pear",
    name: "Pear",
    label: "PE",
    r: 49,
    points: 320,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F350.svg",
    fallbackSpriteUrl: "/assets/fruits/pear.svg",
    fallbackA: "#e5ffa5",
    fallbackB: "#90db44",
    drawScale: 1,
    spriteScale: 1.07
  },
  {
    id: "peach",
    name: "Peach",
    label: "PC",
    r: 59,
    points: 640,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F351.svg",
    fallbackSpriteUrl: "/assets/fruits/peach.svg",
    fallbackA: "#ffd9bf",
    fallbackB: "#ff9e6a",
    drawScale: 1,
    spriteScale: 1.06
  },
  {
    id: "melon",
    name: "Melon",
    label: "ML",
    r: 72,
    points: 1280,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F348.svg",
    fallbackSpriteUrl: "/assets/fruits/melon.svg",
    fallbackA: "#f4bf79",
    fallbackB: "#dd8b43",
    drawScale: 1,
    spriteScale: 1.08
  },
  {
    id: "watermelon",
    name: "Watermelon",
    label: "WM",
    r: 88,
    points: 2560,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F349.svg",
    fallbackSpriteUrl: "/assets/fruits/watermelon.svg",
    fallbackA: "#6acb57",
    fallbackB: "#2a8f43",
    drawScale: 1,
    spriteScale: 1.06
  },
  {
    id: "pumpkin",
    name: "Pumpkin",
    label: "PK",
    r: 104,
    points: 5120,
    spriteUrl: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F383.svg",
    fallbackSpriteUrl: "/assets/fruits/pumpkin.svg",
    fallbackA: "#ffb971",
    fallbackB: "#e06f22",
    special: "pumpkin",
    drawScale: 1,
    spriteScale: 1.04
  }
];

export const TERMINAL_FRUIT_ID: FruitTierId = "pumpkin";
