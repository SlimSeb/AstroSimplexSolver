/**
 * Two-phase primal Simplex method for linear programs.
 *
 * The solver accepts a problem in "natural" form (max/min, with <=, >=, =
 * constraints and non-negative variables), converts it to standard form by
 * adding slack, surplus and artificial variables, and then runs the Simplex
 * algorithm. Every pivot is recorded so the UI can replay the tableau history.
 */

export type Relation = "<=" | ">=" | "=";
export type ObjectiveSense = "max" | "min";
export type SolveStatus = "optimal" | "infeasible" | "unbounded";

export interface Constraint {
  /** Coefficients, one per structural variable. */
  coeffs: number[];
  relation: Relation;
  rhs: number;
}

export interface LPProblem {
  sense: ObjectiveSense;
  /** Objective coefficients, one per structural variable. */
  objective: number[];
  constraints: Constraint[];
  /** Optional display names for the structural variables. */
  variableNames?: string[];
}

/** Roles a tableau column can play, used for colour-coding in the UI. */
export type ColumnKind = "structural" | "slack" | "surplus" | "artificial";

/**
 * A locale-agnostic description of what happened in an iteration. The solver
 * stays language-free; the UI turns these into translated sentences.
 */
export type IterationNote =
  | { kind: "optimal"; phase: 1 | 2 }
  | { kind: "unbounded"; column: string }
  | { kind: "pivot"; phase: 1 | 2; entering: string; leaving: string; row: number }
  | { kind: "iteration-limit" };

export interface SimplexIteration {
  phase: 1 | 2;
  index: number;
  /** Constraint matrix rows; the trailing entry of each row is the RHS. */
  rows: number[][];
  /** Reduced-cost / objective row (c_j - z_j); trailing entry is -z. */
  objectiveRow: number[];
  /** Column index of the basic variable for each row. */
  basis: number[];
  /** Entering variable column index, or null when the phase is optimal. */
  entering: number | null;
  /** Leaving variable column index, or null when no pivot happens. */
  leaving: number | null;
  pivotRow: number | null;
  pivotCol: number | null;
  /** Objective value of the *original* problem at this tableau. */
  objectiveValue: number;
  note: IterationNote;
}

export interface SimplexResult {
  status: SolveStatus;
  iterations: SimplexIteration[];
  /** Optimal value of the original objective (only meaningful if optimal). */
  objectiveValue: number;
  /** Values of the structural variables at the optimum. */
  solution: number[];
  /** Names of every tableau column (structural + added variables). */
  columnNames: string[];
  columnKinds: ColumnKind[];
  variableNames: string[];
}

const EPS = 1e-9;

/** Deep-copies a matrix. */
function cloneMatrix(m: number[][]): number[][] {
  return m.map((row) => row.slice());
}

/** Round values that are within EPS of an integer to remove float noise. */
export function tidy(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 1e-7) return rounded === 0 ? 0 : rounded;
  return Math.round(value * 1e6) / 1e6;
}

export function solveLP(problem: LPProblem): SimplexResult {
  const numStruct = problem.objective.length;
  const m = problem.constraints.length;

  const variableNames =
    problem.variableNames && problem.variableNames.length === numStruct
      ? problem.variableNames.slice()
      : Array.from({ length: numStruct }, (_, j) => `x${j + 1}`);

  // 1. Normalise constraints so every RHS is non-negative.
  const cons = problem.constraints.map((con) => {
    let coeffs = con.coeffs.slice();
    let rhs = con.rhs;
    let relation = con.relation;
    if (rhs < 0) {
      coeffs = coeffs.map((v) => -v);
      rhs = -rhs;
      relation = relation === "<=" ? ">=" : relation === ">=" ? "<=" : "=";
    }
    // Pad / trim coefficient vectors to the structural variable count.
    while (coeffs.length < numStruct) coeffs.push(0);
    return { coeffs: coeffs.slice(0, numStruct), rhs, relation };
  });

  // 2. Allocate columns: structural, then slack/surplus, then artificial.
  const columnNames: string[] = [];
  const columnKinds: ColumnKind[] = [];
  for (let j = 0; j < numStruct; j++) {
    columnNames.push(variableNames[j]);
    columnKinds.push("structural");
  }

  const slackSurplusCol: (number | null)[] = new Array(m).fill(null);
  const slackSurplusSign: number[] = new Array(m).fill(0);
  let nextCol = numStruct;
  for (let i = 0; i < m; i++) {
    const r = cons[i].relation;
    if (r === "<=") {
      slackSurplusCol[i] = nextCol++;
      slackSurplusSign[i] = 1;
      columnNames.push(`s${i + 1}`);
      columnKinds.push("slack");
    } else if (r === ">=") {
      slackSurplusCol[i] = nextCol++;
      slackSurplusSign[i] = -1;
      columnNames.push(`s${i + 1}`);
      columnKinds.push("surplus");
    }
  }

  const artificialCol: (number | null)[] = new Array(m).fill(null);
  for (let i = 0; i < m; i++) {
    const r = cons[i].relation;
    if (r === ">=" || r === "=") {
      artificialCol[i] = nextCol++;
      columnNames.push(`a${i + 1}`);
      columnKinds.push("artificial");
    }
  }
  const totalCols = nextCol;
  const hasArtificial = artificialCol.some((c) => c !== null);

  // 3. Build the constraint matrix, RHS vector and starting basis.
  const A: number[][] = [];
  const b: number[] = [];
  const basis: number[] = [];
  for (let i = 0; i < m; i++) {
    const row = new Array(totalCols).fill(0);
    for (let j = 0; j < numStruct; j++) row[j] = cons[i].coeffs[j];
    if (slackSurplusCol[i] !== null) {
      row[slackSurplusCol[i] as number] = slackSurplusSign[i];
    }
    if (artificialCol[i] !== null) {
      row[artificialCol[i] as number] = 1;
    }
    A.push(row);
    b.push(cons[i].rhs);
    basis.push(
      artificialCol[i] !== null
        ? (artificialCol[i] as number)
        : (slackSurplusCol[i] as number),
    );
  }

  // Maximisation form of the original objective (we always maximise internally).
  const objMax = problem.objective.map((c) =>
    problem.sense === "min" ? -c : c,
  );
  const phase2Cost = new Array(totalCols).fill(0);
  for (let j = 0; j < numStruct; j++) phase2Cost[j] = objMax[j];

  /** Convert an internal (maximised) objective value to the original sense. */
  const toOriginal = (zMax: number) =>
    tidy(problem.sense === "min" ? -zMax : zMax);

  const iterations: SimplexIteration[] = [];

  /** Current value of the *original* objective from the running basis. */
  const originalObjective = (): number => {
    let zMax = 0;
    for (let i = 0; i < m; i++) zMax += phase2Cost[basis[i]] * b[i];
    return toOriginal(zMax);
  };

  const snapshot = (
    phase: 1 | 2,
    cost: number[],
    entering: number | null,
    leaving: number | null,
    pivotRow: number | null,
    pivotCol: number | null,
    note: IterationNote,
  ): void => {
    const objectiveRow = new Array(totalCols + 1).fill(0);
    let z = 0;
    for (let i = 0; i < m; i++) z += cost[basis[i]] * b[i];
    for (let j = 0; j < totalCols; j++) {
      let zj = 0;
      for (let i = 0; i < m; i++) zj += cost[basis[i]] * A[i][j];
      objectiveRow[j] = tidy(cost[j] - zj);
    }
    objectiveRow[totalCols] = tidy(-z);

    const rows = cloneMatrix(A).map((row, i) => {
      const full = row.map(tidy);
      full.push(tidy(b[i]));
      return full;
    });

    iterations.push({
      phase,
      index: iterations.length,
      rows,
      objectiveRow,
      basis: basis.slice(),
      entering,
      leaving,
      pivotRow,
      pivotCol,
      objectiveValue: originalObjective(),
      note,
    });
  };

  /** Pivot the tableau on (pivotRow, pivotCol) via Gauss-Jordan elimination. */
  const pivot = (pivotRow: number, pivotCol: number): void => {
    const piv = A[pivotRow][pivotCol];
    for (let j = 0; j < totalCols; j++) A[pivotRow][j] /= piv;
    b[pivotRow] /= piv;
    for (let i = 0; i < m; i++) {
      if (i === pivotRow) continue;
      const factor = A[i][pivotCol];
      if (Math.abs(factor) < EPS) continue;
      for (let j = 0; j < totalCols; j++) A[i][j] -= factor * A[pivotRow][j];
      b[i] -= factor * b[pivotRow];
    }
    basis[pivotRow] = pivotCol;
  };

  /**
   * Runs one Simplex phase to optimality. `allowed` lists the columns that may
   * enter the basis. Returns "optimal" or "unbounded".
   */
  const runPhase = (
    phase: 1 | 2,
    cost: number[],
    allowed: boolean[],
  ): "optimal" | "unbounded" => {
    const maxIters = 200 + 20 * (m + totalCols);
    for (let guard = 0; guard < maxIters; guard++) {
      // Reduced costs for the columns that are allowed to enter.
      let entering = -1;
      let bestReduced = EPS;
      for (let j = 0; j < totalCols; j++) {
        if (!allowed[j]) continue;
        let zj = 0;
        for (let i = 0; i < m; i++) zj += cost[basis[i]] * A[i][j];
        const reduced = cost[j] - zj;
        if (reduced > bestReduced) {
          bestReduced = reduced;
          entering = j;
        }
      }

      if (entering === -1) {
        snapshot(phase, cost, null, null, null, null, { kind: "optimal", phase });
        return "optimal";
      }

      // Minimum-ratio test to find the leaving variable.
      let leavingRow = -1;
      let minRatio = Infinity;
      for (let i = 0; i < m; i++) {
        if (A[i][entering] > EPS) {
          const ratio = b[i] / A[i][entering];
          if (
            ratio < minRatio - EPS ||
            (Math.abs(ratio - minRatio) < EPS &&
              leavingRow >= 0 &&
              basis[i] < basis[leavingRow])
          ) {
            minRatio = ratio;
            leavingRow = i;
          }
        }
      }

      if (leavingRow === -1) {
        snapshot(phase, cost, entering, null, null, entering, {
          kind: "unbounded",
          column: columnNames[entering],
        });
        return "unbounded";
      }

      snapshot(
        phase,
        cost,
        entering,
        basis[leavingRow],
        leavingRow,
        entering,
        {
          kind: "pivot",
          phase,
          entering: columnNames[entering],
          leaving: columnNames[basis[leavingRow]],
          row: leavingRow + 1,
        },
      );
      pivot(leavingRow, entering);
    }
    // Iteration guard tripped; treat the current tableau as optimal.
    snapshot(phase, cost, null, null, null, null, { kind: "iteration-limit" });
    return "optimal";
  };

  // 4. Phase 1, drive artificial variables to zero (only if any exist).
  if (hasArtificial) {
    const phase1Cost = new Array(totalCols).fill(0);
    for (let j = 0; j < totalCols; j++) {
      if (columnKinds[j] === "artificial") phase1Cost[j] = -1; // maximise -sum a
    }
    const allowedP1 = new Array(totalCols).fill(true);
    runPhase(1, phase1Cost, allowedP1);

    // Sum of artificials = -(phase 1 objective). If positive, infeasible.
    let artificialSum = 0;
    for (let i = 0; i < m; i++) {
      if (columnKinds[basis[i]] === "artificial") artificialSum += b[i];
    }
    if (artificialSum > 1e-6) {
      return {
        status: "infeasible",
        iterations,
        objectiveValue: NaN,
        solution: new Array(numStruct).fill(0),
        columnNames,
        columnKinds,
        variableNames,
      };
    }
  }

  // 5. Phase 2, optimise the real objective, forbidding artificial columns.
  const allowedP2 = columnKinds.map((kind) => kind !== "artificial");
  const phase2Status = runPhase(2, phase2Cost, allowedP2);

  if (phase2Status === "unbounded") {
    return {
      status: "unbounded",
      iterations,
      objectiveValue: problem.sense === "min" ? -Infinity : Infinity,
      solution: new Array(numStruct).fill(0),
      columnNames,
      columnKinds,
      variableNames,
    };
  }

  // 6. Read off the structural-variable values from the final basis.
  const solution = new Array(numStruct).fill(0);
  for (let i = 0; i < m; i++) {
    const col = basis[i];
    if (col < numStruct) solution[col] = tidy(b[i]);
  }

  return {
    status: "optimal",
    iterations,
    objectiveValue: originalObjective(),
    solution,
    columnNames,
    columnKinds,
    variableNames,
  };
}
