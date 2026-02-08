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
    spriteUrl: "/assets/fruits/cherry.svg",
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
    spriteUrl: "/assets/fruits/lemon.svg",
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
    spriteUrl: "/assets/fruits/kiwi.svg",
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
    spriteUrl: "/assets/fruits/orange.svg",
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
    spriteUrl: "/assets/fruits/apple.svg",
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
    spriteUrl: "/assets/fruits/pear.svg",
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
    spriteUrl: "/assets/fruits/peach.svg",
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
    spriteUrl: "/assets/fruits/melon.svg",
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
    spriteUrl: "/assets/fruits/watermelon.svg",
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
    spriteUrl: "/assets/fruits/pumpkin.svg",
    fallbackSpriteUrl: "/assets/fruits/pumpkin.svg",
    fallbackA: "#ffb971",
    fallbackB: "#e06f22",
    special: "pumpkin",
    drawScale: 1,
    spriteScale: 1.04
  }
];

export const TERMINAL_FRUIT_ID: FruitTierId = "pumpkin";
