# Simplex Solver

An interactive linear-programming solver built with **Astro + React islands + Tailwind CSS v4 + Framer Motion + TypeScript**. Build a linear program in the browser, solve it with the **two-phase primal Simplex method**, and step through every pivot in an animated tableau.

**Live demo: [https://simplex.slim.tf/](https://simplex.slim.tf/)**

## Features

- Maximisation **and** minimisation objectives.
- `≤`, `≥` and `=` constraints, slack, surplus and artificial variables are added automatically.
- **Phase 1 / Phase 2** two-phase method, used only when artificial variables are needed.
- Detects **optimal**, **unbounded** and **infeasible** problems.
- Animated tableau playback: play/pause, step forwards/back, scrub with a slider; the entering column, leaving row and pivot element are highlighted.
- Dynamic problem builder (1–8 variables, any number of constraints) plus ready-made example problems.

## Stack

| Layer        | Choice                                    |
| ------------ | ----------------------------------------- |
| Framework    | Astro 7 (static output)                   |
| Interactivity| React 19 island (`client:load`)           |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite`)     |
| Animation    | Framer Motion                             |
| Language     | TypeScript (strict)                       |

> Requires **Node ≥ 22.12** (Astro 7).

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static build into dist/
npm run preview  # serve the production build
```

## Project layout

```
src/
  lib/
    simplex.ts     # two-phase Simplex algorithm + iteration recording (no UI deps)
    format.ts      # number / expression formatting helpers
    presets.ts     # example linear programs
  components/
    SimplexSolver.tsx  # main React island: problem builder + playback controls
    TableauView.tsx    # single-iteration tableau with pivot highlighting
  layouts/Layout.astro
  pages/index.astro
```

## How the solver works

`solveLP` (in `src/lib/simplex.ts`) is a pure function with no UI dependencies:

1. Normalises every constraint so the right-hand side is non-negative.
2. Adds slack (`≤`), surplus + artificial (`≥`) or artificial (`=`) columns.
3. **Phase 1** minimises the sum of artificial variables; if that sum stays positive the problem is **infeasible**.
4. **Phase 2** optimises the real objective (forbidding artificial columns); if a column can increase without bound the problem is **unbounded**.
5. Records the full tableau, basis, reduced-cost row and entering/leaving variables at every pivot for the UI to replay.

Internally the algorithm always maximises (minimisation objectives are negated) and uses Dantzig's rule with index-based tie-breaking and an iteration guard.
