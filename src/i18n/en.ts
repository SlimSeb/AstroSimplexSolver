import type { Messages } from "./types";

export const en: Messages = {
  meta: {
    title: "Simplex Solver · Two-Phase Linear Programming Calculator",
    description:
      "Free interactive Simplex method solver for linear programming. Build a max or min objective with ≤, ≥ and = constraints, then step through every pivot of the two-phase Simplex tableau.",
    keywords:
      "simplex method, linear programming solver, two-phase simplex, LP solver, simplex tableau, operations research, optimization calculator",
  },
  header: {
    eyebrow: "Linear Programming · Two-Phase Method",
    title: "Simplex Solver",
    intro:
      "Build a linear program, hit solve, and step through every Simplex pivot. Handles maximisation and minimisation with ≤, ≥ and = constraints, artificial variables and Phase 1 are added automatically when needed.",
  },
  footer: { builtWith: "Built with Astro · React · Tailwind · Framer Motion" },
  themeToggle: { aria: "Toggle colour theme" },
  langSwitcher: { aria: "Choose language" },
  solver: {
    defineProblem: "Define the problem",
    loadExample: "Load example…",
    objectiveLabel: "Z =",
    senseMax: "max",
    senseMin: "min",
    addVariable: "Add variable",
    removeVariable: "Remove variable",
    subjectTo: "Subject to",
    nonNegativity: (vars) => `with ${vars} ≥ 0`,
    addConstraint: "+ Add constraint",
    removeConstraint: "Remove constraint",
    solve: "Solve",
    result: "Result",
    status: {
      optimal: "optimal",
      unbounded: "unbounded",
      infeasible: "infeasible",
    },
    unboundedMessage: "The objective grows without limit in the feasible region.",
    infeasibleMessage: "No point satisfies all constraints simultaneously.",
    phase: (n) => `Phase ${n}`,
    iteration: (current, total) => `Iteration ${current} / ${total}`,
    legend: {
      enteringColumn: "Entering column",
      pivotRow: "Pivot row",
      pivotElement: "Pivot element",
      variableKinds: "xⱼ decision · sⱼ slack / surplus · aⱼ artificial",
    },
  },
  tableau: {
    basis: "Basis",
    rhs: "RHS",
  },
  presets: {
    wyndor: {
      label: "Product mix (max)",
      description: "Classic two-variable maximisation with three resource limits.",
    },
    blend: {
      label: "Diet blend (min, two-phase)",
      description: "Minimisation mixing =, <= and >= constraints, needs phase 1.",
    },
    "three-var": {
      label: "Three products (max)",
      description: "Three decision variables and two shared constraints.",
    },
  },
  note: (note) => {
    switch (note.kind) {
      case "optimal":
        return `Phase ${note.phase} optimal: no entering variable improves the objective.`;
      case "unbounded":
        return `Column ${note.column} can increase without bound, the problem is unbounded.`;
      case "pivot":
        return `Phase ${note.phase}: ${note.entering} enters, ${note.leaving} leaves (pivot on row ${note.row}).`;
      case "iteration-limit":
        return "Iteration limit reached.";
    }
  },
};
