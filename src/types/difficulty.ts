export interface Difficulty {
  id: string;
  name: string;
  icon: string;
  color: string;
  salmonCount: number;
  initialSpeed: number;
  speedUpInterval: number;
  speedUpRate: number;
  hasGarbage: boolean;
  garbageFrequency?: "low" | "high";
}
