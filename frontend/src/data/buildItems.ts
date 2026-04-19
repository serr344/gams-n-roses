export type BuildItemId =
  | "stage"
  | "standard-speaker"
  | "directional-speaker"
  | "eco-speaker"
  | "basic-barrier"
  | "premium-wall"
  | "smart-amplifier";

export type BuildItemDefinition = {
  id: BuildItemId;
  name: string;
  cost: number;
  description: string;
  width: number;
  height: number;
  color: string;
  unique?: boolean;
  icon?: string;
};

export const BUILD_ITEMS: BuildItemDefinition[] = [
  {
    id: "stage",
    name: "Concert Stage",
    cost: 0,
    description: "Main concert stage. Only one can be placed.",
    width: 4,
    height: 3,
    color: "#c026d3",
    unique: true,
    icon: "/items/stage.png",
  },
  {
    id: "standard-speaker",
    name: "Standard Speaker",
    cost: 200,
    description: "Balanced sound output for general audience coverage.",
    width: 1,
    height: 1,
    color: "#facc15",
    icon: "/items/standard-speaker.png",
  },
  {
    id: "directional-speaker",
    name: "Directional Speaker",
    cost: 300,
    description: "Focus sound toward one direction with less side leakage.",
    width: 1,
    height: 1,
    color: "#38bdf8",
    icon: "/items/directional-speaker.png",
  },
  {
    id: "eco-speaker",
    name: "Eco Speaker",
    cost: 120,
    description: "Lower noise and lower cost for sensitive areas.",
    width: 1,
    height: 1,
    color: "#4ade80",
    icon: "/items/eco-speaker.png",
  },
  {
    id: "basic-barrier",
    name: "Basic Barrier",
    cost: 150,
    description: "Reduces sound behind the barrier.",
    width: 2,
    height: 1,
    color: "#94a3b8",
    icon: "/items/basic-barrier.png",
  },
  {
    id: "premium-wall",
    name: "Premium Acoustic Wall",
    cost: 280,
    description: "Strong protection for hospitals, libraries, and schools.",
    width: 3,
    height: 1,
    color: "#64748b",
    icon: "/items/premium-wall.png",
  },
  {
    id: "smart-amplifier",
    name: "Smart Amplifier",
    cost: 260,
    description: "Improves sound efficiency while reducing wasted spillover.",
    width: 1,
    height: 1,
    color: "#fb923c",
    icon: "/items/smart-amplifier.png",
  },
];

export const BUILD_ITEM_MAP = Object.fromEntries(
  BUILD_ITEMS.map((item) => [item.id, item])
) as Record<BuildItemId, BuildItemDefinition>;