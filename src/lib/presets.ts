import type { ObjectiveSense, Relation } from "./simplex";

export interface PresetConstraint {
  coeffs: number[];
  relation: Relation;
  rhs: number;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  sense: ObjectiveSense;
  objective: number[];
  constraints: PresetConstraint[];
}

export const PRESETS: Preset[] = [
  {
    id: "wyndor",
    label: "Product mix (max)",
    description: "Classic two-variable maximisation with three resource limits.",
    sense: "max",
    objective: [3, 5],
    constraints: [
      { coeffs: [1, 0], relation: "<=", rhs: 4 },
      { coeffs: [0, 2], relation: "<=", rhs: 12 },
      { coeffs: [3, 2], relation: "<=", rhs: 18 },
    ],
  },
  {
    id: "blend",
    label: "Diet blend (min, two-phase)",
    description: "Minimisation mixing =, <= and >= constraints, needs phase 1.",
    sense: "min",
    objective: [0.4, 0.5],
    constraints: [
      { coeffs: [0.3, 0.1], relation: "<=", rhs: 2.7 },
      { coeffs: [0.5, 0.5], relation: "=", rhs: 6 },
      { coeffs: [0.6, 0.4], relation: ">=", rhs: 6 },
    ],
  },
  {
    id: "three-var",
    label: "Three products (max)",
    description: "Three decision variables and two shared constraints.",
    sense: "max",
    objective: [5, 4, 3],
    constraints: [
      { coeffs: [2, 3, 1], relation: "<=", rhs: 5 },
      { coeffs: [4, 1, 2], relation: "<=", rhs: 11 },
      { coeffs: [3, 4, 2], relation: "<=", rhs: 8 },
    ],
  },
];
