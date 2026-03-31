import { SalmonType } from "@/types/salmon";

export const SALMON_TYPES: SalmonType[] = [
  { id: "atlantic", name: "アトランティックサーモン", image: "アトランティックサーモン.png" },
  { id: "king",     name: "キングサーモン",         image: "キングサーモン.png" },
  { id: "sockeye",  name: "紅鮭",                  image: "紅鮭.png" },
  { id: "silver",   name: "銀鮭",                  image: "銀鮭.png" },
  { id: "trout",    name: "トラウトサーモン",        image: "トラウトサーモン.png" },
  { id: "chum",     name: "秋鮭",                  image: "秋鮭.png" },
  { id: "pink",     name: "カラフトマス",            image: "カラフトマス.png" },
  { id: "cherry",   name: "サクラマス",              image: "サクラマス.png" },
];

export const GRID_COLS = 6;
export const GRID_ROWS = 12;
export const CELL_SIZE = 48;
