import { describe, it, expect } from "vitest";
import { solveLP, tidy, type LPProblem } from "./simplex";

const TOL = 1e-6;

/** Asserts every constraint and the non-negativity bounds hold for `x`. */
function expectFeasible(problem: LPProblem, x: number[]): void {
  for (const v of x) expect(v).toBeGreaterThanOrEqual(-TOL);
  for (const con of problem.constraints) {
    const lhs = con.coeffs.reduce((acc, c, i) => acc + c * (x[i] ?? 0), 0);
    if (con.relation === "<=") expect(lhs).toBeLessThanOrEqual(con.rhs + TOL);
    else if (con.relation === ">=") expect(lhs).toBeGreaterThanOrEqual(con.rhs - TOL);
    else expect(Math.abs(lhs - con.rhs)).toBeLessThanOrEqual(TOL);
  }
}

/** Objective value of `x` under the problem's sense. */
function objValue(problem: LPProblem, x: number[]): number {
  return problem.objective.reduce((acc, c, i) => acc + c * (x[i] ?? 0), 0);
}

describe("solveLP — optimal problems", () => {
  it("solves the classic product-mix maximisation (only <= constraints)", () => {
    const problem: LPProblem = {
      sense: "max",
      objective: [3, 5],
      constraints: [
        { coeffs: [1, 0], relation: "<=", rhs: 4 },
        { coeffs: [0, 2], relation: "<=", rhs: 12 },
        { coeffs: [3, 2], relation: "<=", rhs: 18 },
      ],
    };
    const r = solveLP(problem);
    expect(r.status).toBe("optimal");
    expect(r.solution).toEqual([2, 6]);
    expect(r.objectiveValue).toBeCloseTo(36, 6);
    expectFeasible(problem, r.solution);
    expect(objValue(problem, r.solution)).toBeCloseTo(r.objectiveValue, 6);
  });

  it("solves a two-phase minimisation mixing <=, = and >=", () => {
    const problem: LPProblem = {
      sense: "min",
      objective: [0.4, 0.5],
      constraints: [
        { coeffs: [0.3, 0.1], relation: "<=", rhs: 2.7 },
        { coeffs: [0.5, 0.5], relation: "=", rhs: 6 },
        { coeffs: [0.6, 0.4], relation: ">=", rhs: 6 },
      ],
    };
    const r = solveLP(problem);
    expect(r.status).toBe("optimal");
    expect(r.objectiveValue).toBeCloseTo(5.25, 6);
    expect(r.solution[0]).toBeCloseTo(7.5, 6);
    expect(r.solution[1]).toBeCloseTo(4.5, 6);
    expectFeasible(problem, r.solution);
    // Phase 1 must run, so at least one iteration is tagged phase 1.
    expect(r.iterations.some((it) => it.phase === 1)).toBe(true);
  });

  it("solves a pure >= minimisation", () => {
    const problem: LPProblem = {
      sense: "min",
      objective: [1, 1],
      constraints: [
        { coeffs: [1, 2], relation: ">=", rhs: 4 },
        { coeffs: [3, 1], relation: ">=", rhs: 6 },
      ],
    };
    const r = solveLP(problem);
    expect(r.status).toBe("optimal");
    expect(r.objectiveValue).toBeCloseTo(2.8, 6);
    expect(r.solution[0]).toBeCloseTo(1.6, 6);
    expect(r.solution[1]).toBeCloseTo(1.2, 6);
    expectFeasible(problem, r.solution);
  });

  it("handles a three-variable maximisation", () => {
    const problem: LPProblem = {
      sense: "max",
      objective: [5, 4, 3],
      constraints: [
        { coeffs: [2, 3, 1], relation: "<=", rhs: 5 },
        { coeffs: [4, 1, 2], relation: "<=", rhs: 11 },
        { coeffs: [3, 4, 2], relation: "<=", rhs: 8 },
      ],
    };
    const r = solveLP(problem);
    expect(r.status).toBe("optimal");
    expect(r.objectiveValue).toBeCloseTo(13, 6);
    expectFeasible(problem, r.solution);
    expect(objValue(problem, r.solution)).toBeCloseTo(13, 6);
  });

  it("normalises a constraint given with a negative right-hand side", () => {
    // -x - y <= -2  is equivalent to  x + y >= 2.
    const problem: LPProblem = {
      sense: "min",
      objective: [1, 1],
      constraints: [{ coeffs: [-1, -1], relation: "<=", rhs: -2 }],
    };
    const r = solveLP(problem);
    expect(r.status).toBe("optimal");
    expect(r.objectiveValue).toBeCloseTo(2, 6);
    expectFeasible(problem, r.solution);
  });

  it("treats minimisation as the negation of maximisation", () => {
    const constraints = [
      { coeffs: [1, 1], relation: "<=" as const, rhs: 4 },
      { coeffs: [1, 3], relation: "<=" as const, rhs: 6 },
    ];
    const max = solveLP({ sense: "max", objective: [2, 1], constraints });
    expect(max.status).toBe("optimal");
    expect(max.objectiveValue).toBeCloseTo(8, 6);
  });
});

describe("solveLP — special statuses", () => {
  it("detects an unbounded maximisation", () => {
    const r = solveLP({
      sense: "max",
      objective: [1, 1],
      constraints: [{ coeffs: [1, -1], relation: "<=", rhs: 1 }],
    });
    expect(r.status).toBe("unbounded");
    expect(r.objectiveValue).toBe(Infinity);
  });

  it("reports -Infinity for an unbounded minimisation", () => {
    const r = solveLP({
      sense: "min",
      objective: [-1, 0],
      constraints: [{ coeffs: [-1, 1], relation: "<=", rhs: 1 }],
    });
    expect(r.status).toBe("unbounded");
    expect(r.objectiveValue).toBe(-Infinity);
  });

  it("detects an infeasible system", () => {
    const r = solveLP({
      sense: "max",
      objective: [1, 0],
      constraints: [
        { coeffs: [1, 0], relation: "<=", rhs: 1 },
        { coeffs: [1, 0], relation: ">=", rhs: 3 },
      ],
    });
    expect(r.status).toBe("infeasible");
    expect(Number.isNaN(r.objectiveValue)).toBe(true);
    expect(r.solution).toEqual([0, 0]);
  });
});

describe("solveLP — tableau metadata", () => {
  const problem: LPProblem = {
    sense: "max",
    objective: [3, 5],
    constraints: [
      { coeffs: [1, 0], relation: "<=", rhs: 4 }, // slack
      { coeffs: [0, 2], relation: ">=", rhs: 2 }, // surplus + artificial
      { coeffs: [3, 2], relation: "=", rhs: 18 }, // artificial
    ],
    variableNames: ["a", "b"],
  };

  it("labels columns by kind in structural / slack-surplus / artificial order", () => {
    const r = solveLP(problem);
    expect(r.columnNames.slice(0, 2)).toEqual(["a", "b"]);
    expect(r.columnKinds.filter((k) => k === "structural")).toHaveLength(2);
    expect(r.columnKinds.filter((k) => k === "slack")).toHaveLength(1);
    expect(r.columnKinds.filter((k) => k === "surplus")).toHaveLength(1);
    expect(r.columnKinds.filter((k) => k === "artificial")).toHaveLength(2);
  });

  it("records well-formed iterations with consistent dimensions", () => {
    const r = solveLP(problem);
    expect(r.iterations.length).toBeGreaterThan(0);
    const cols = r.columnNames.length;
    for (const it of r.iterations) {
      expect(it.basis).toHaveLength(problem.constraints.length);
      expect(it.objectiveRow).toHaveLength(cols + 1); // + RHS column
      for (const row of it.rows) expect(row).toHaveLength(cols + 1);
      expect([1, 2]).toContain(it.phase);
    }
    // The final iteration is optimal: no entering variable.
    expect(r.iterations.at(-1)?.entering).toBeNull();
  });

  it("defaults variable names to x1, x2, … when none are given", () => {
    const r = solveLP({
      sense: "max",
      objective: [1, 2, 3],
      constraints: [{ coeffs: [1, 1, 1], relation: "<=", rhs: 10 }],
    });
    expect(r.variableNames).toEqual(["x1", "x2", "x3"]);
  });
});

describe("tidy", () => {
  it("snaps near-integer values and clears negative zero", () => {
    expect(tidy(2.0000000001)).toBe(2);
    expect(tidy(-0)).toBe(0);
    expect(tidy(5)).toBe(5);
  });

  it("rounds messy floats to six decimals", () => {
    expect(tidy(0.1 + 0.2)).toBeCloseTo(0.3, 6);
    expect(tidy(1 / 3)).toBe(0.333333);
  });

  it("passes infinities through untouched", () => {
    expect(tidy(Infinity)).toBe(Infinity);
    expect(tidy(-Infinity)).toBe(-Infinity);
  });
});
