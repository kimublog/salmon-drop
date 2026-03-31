export type SalmonId = "atlantic" | "king" | "sockeye" | "silver" | "trout" | "chum" | "pink" | "cherry";

export interface SalmonType {
  id: SalmonId;
  name: string;
  image: string;
}
