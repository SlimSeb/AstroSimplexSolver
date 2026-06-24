import { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  solveLP,
  type LPProblem,
  type Relation,
  type ObjectiveSense,
  type SimplexResult,
} from "../lib/simplex";
import { fmt } from "../lib/format";
import { PRESETS } from "../lib/presets";
import TableauView from "./TableauView";

interface ConstraintRow {
  coeffs: string[];
  relation: Relation;
  rhs: string;
}

const RELATIONS: Relation[] = ["<=", ">=", "="];

function num(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

const card =
  "rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900";

const fieldBase =
  "rounded-md border border-neutral-300 bg-white text-neutral-900 outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-400";

const numberInput = `w-16 px-2 py-1.5 text-center font-mono text-sm ${fieldBase}`;

const iconBtn =
  "flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900";

const ghostBtn =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900";

const varLabel = "font-mono text-sm text-neutral-500 dark:text-neutral-400";

export default function SimplexSolver() {
  const [sense, setSense] = useState<ObjectiveSense>("max");
  const [objective, setObjective] = useState<string[]>(["3", "5"]);
  const [constraints, setConstraints] = useState<ConstraintRow[]>([
    { coeffs: ["1", "0"], relation: "<=", rhs: "4" },
    { coeffs: ["0", "2"], relation: "<=", rhs: "12" },
    { coeffs: ["3", "2"], relation: "<=", rhs: "18" },
  ]);
  const [result, setResult] = useState<SimplexResult | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tableauRef = useRef<HTMLDivElement>(null);

  const numVars = objective.length;
  const varNames = useMemo(
    () => Array.from({ length: numVars }, (_, i) => `x${i + 1}`),
    [numVars],
  );

  // ---- structural editing -------------------------------------------------
  function setVarCount(next: number) {
    if (next < 1 || next > 8) return;
    setObjective((prev) => {
      const copy = prev.slice(0, next);
      while (copy.length < next) copy.push("0");
      return copy;
    });
    setConstraints((prev) =>
      prev.map((row) => {
        const coeffs = row.coeffs.slice(0, next);
        while (coeffs.length < next) coeffs.push("0");
        return { ...row, coeffs };
      }),
    );
    setResult(null);
  }

  function addConstraint() {
    setConstraints((prev) => [
      ...prev,
      { coeffs: Array(numVars).fill("0"), relation: "<=", rhs: "0" },
    ]);
    setResult(null);
  }

  function removeConstraint(i: number) {
    setConstraints((prev) => prev.filter((_, idx) => idx !== i));
    setResult(null);
  }

  function loadPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setSense(p.sense);
    setObjective(p.objective.map(String));
    setConstraints(
      p.constraints.map((c) => ({
        coeffs: c.coeffs.map(String),
        relation: c.relation,
        rhs: String(c.rhs),
      })),
    );
    setResult(null);
    setStep(0);
  }

  function solve() {
    const problem: LPProblem = {
      sense,
      objective: objective.map(num),
      constraints: constraints.map((c) => ({
        coeffs: c.coeffs.map(num),
        relation: c.relation,
        rhs: num(c.rhs),
      })),
      variableNames: varNames,
    };
    const res = solveLP(problem);
    setResult(res);
    setStep(0);
    setPlaying(res.iterations.length > 1);
    requestAnimationFrame(() =>
      tableauRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  // ---- iteration playback -------------------------------------------------
  const iterCount = result?.iterations.length ?? 0;
  useEffect(() => {
    if (!playing || iterCount === 0) return;
    if (step >= iterCount - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, iterCount - 1)), 1100);
    return () => clearTimeout(t);
  }, [playing, step, iterCount]);

  const current = result?.iterations[step];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* ---------------- Problem builder ---------------- */}
      <section className={card}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Define the problem</h2>
          <select
            onChange={(e) => {
              if (e.target.value) loadPreset(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
            className={`px-3 py-1.5 text-sm ${fieldBase}`}
          >
            <option value="" disabled>
              Load example…
            </option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* objective */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
            {(["max", "min"] as ObjectiveSense[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSense(s);
                  setResult(null);
                }}
                className={`px-4 py-1.5 text-sm font-semibold uppercase tracking-wide transition ${
                  sense === s
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-transparent text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className={varLabel}>Z =</span>
          {objective.map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={c}
                onChange={(e) => {
                  const v = e.target.value;
                  setObjective((prev) => prev.map((x, idx) => (idx === i ? v : x)));
                  setResult(null);
                }}
                className={numberInput}
                inputMode="decimal"
              />
              <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
                {varNames[i]}
              </span>
              {i < numVars - 1 && <span className="text-neutral-400">+</span>}
            </div>
          ))}
          <div className="ml-2 flex items-center gap-1">
            <button
              onClick={() => setVarCount(numVars - 1)}
              className={iconBtn}
              disabled={numVars <= 1}
              title="Remove variable"
            >
              −
            </button>
            <button
              onClick={() => setVarCount(numVars + 1)}
              className={iconBtn}
              disabled={numVars >= 8}
              title="Add variable"
            >
              +
            </button>
          </div>
        </div>

        {/* constraints */}
        <div className="mb-4 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Subject to
          </span>
          <AnimatePresence initial={false}>
            {constraints.map((row, ci) => (
              <motion.div
                key={ci}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2"
              >
                {row.coeffs.map((c, vi) => (
                  <div key={vi} className="flex items-center gap-1">
                    <input
                      value={c}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConstraints((prev) =>
                          prev.map((r, idx) =>
                            idx === ci
                              ? { ...r, coeffs: r.coeffs.map((x, j) => (j === vi ? v : x)) }
                              : r,
                          ),
                        );
                        setResult(null);
                      }}
                      className={numberInput}
                      inputMode="decimal"
                    />
                    <span className={varLabel}>{varNames[vi]}</span>
                    {vi < numVars - 1 && <span className="text-neutral-400">+</span>}
                  </div>
                ))}
                <select
                  value={row.relation}
                  onChange={(e) => {
                    const v = e.target.value as Relation;
                    setConstraints((prev) =>
                      prev.map((r, idx) => (idx === ci ? { ...r, relation: v } : r)),
                    );
                    setResult(null);
                  }}
                  className={`px-2 py-1.5 font-mono text-sm ${fieldBase}`}
                >
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  value={row.rhs}
                  onChange={(e) => {
                    const v = e.target.value;
                    setConstraints((prev) =>
                      prev.map((r, idx) => (idx === ci ? { ...r, rhs: v } : r)),
                    );
                    setResult(null);
                  }}
                  className={numberInput}
                  inputMode="decimal"
                />
                <button
                  onClick={() => removeConstraint(ci)}
                  className={iconBtn}
                  disabled={constraints.length <= 1}
                  title="Remove constraint"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <p className="mt-1 font-mono text-xs text-neutral-400 dark:text-neutral-500">
            with {varNames.join(", ")} ≥ 0
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={addConstraint} className={ghostBtn}>
            + Add constraint
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={solve}
            className="rounded-md bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Solve
          </motion.button>
        </div>
      </section>

      {/* ---------------- Result ---------------- */}
      <AnimatePresence>
        {result && current && (
          <motion.section
            ref={tableauRef}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={card}
          >
            <ResultHeader result={result} />

            {result.iterations.length > 0 && (
              <>
                <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        current.phase === 1
                          ? "border-orange-600/60 text-orange-700 dark:text-orange-500"
                          : "border-emerald-600/60 text-emerald-800 dark:text-emerald-400"
                      }`}
                    >
                      Phase {current.phase}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      Iteration {step + 1} / {result.iterations.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StepBtn onClick={() => { setPlaying(false); setStep(0); }} disabled={step === 0}>
                      ⏮
                    </StepBtn>
                    <StepBtn
                      onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }}
                      disabled={step === 0}
                    >
                      ◂
                    </StepBtn>
                    <StepBtn
                      onClick={() => setPlaying((p) => !p)}
                      disabled={result.iterations.length <= 1}
                    >
                      {playing ? "❚❚" : "▶"}
                    </StepBtn>
                    <StepBtn
                      onClick={() => { setPlaying(false); setStep((s) => Math.min(result.iterations.length - 1, s + 1)); }}
                      disabled={step >= result.iterations.length - 1}
                    >
                      ▸
                    </StepBtn>
                    <StepBtn
                      onClick={() => { setPlaying(false); setStep(result.iterations.length - 1); }}
                      disabled={step >= result.iterations.length - 1}
                    >
                      ⏭
                    </StepBtn>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={result.iterations.length - 1}
                  value={step}
                  onChange={(e) => { setPlaying(false); setStep(Number(e.target.value)); }}
                  className="mb-4 w-full accent-neutral-900 dark:accent-white"
                />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <TableauView
                      iteration={current}
                      columnNames={result.columnNames}
                      columnKinds={result.columnKinds}
                    />
                  </motion.div>
                </AnimatePresence>

                <motion.p
                  key={`note-${step}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-sm text-neutral-500 dark:text-neutral-400"
                >
                  {current.note}
                </motion.p>

                <Legend />
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultHeader({ result }: { result: SimplexResult }) {
  const badge =
    result.status === "optimal"
      ? "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-neutral-950"
      : result.status === "unbounded"
        ? "border-orange-600/70 text-orange-700 dark:text-orange-500"
        : "border-dashed border-orange-600/70 text-orange-700 dark:text-orange-500";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold">Result</h2>
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badge}`}
        >
          {result.status}
        </span>
      </div>
      {result.status === "optimal" && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-mono text-neutral-600 dark:text-neutral-300">
            Z<sup>*</sup> ={" "}
            <span className="text-base font-semibold text-emerald-800 dark:text-emerald-500">
              {fmt(result.objectiveValue)}
            </span>
          </span>
          <span className="font-mono text-neutral-500 dark:text-neutral-400">
            {result.solution
              .map((v, i) => `${result.variableNames[i]} = ${fmt(v)}`)
              .join(",  ")}
          </span>
        </div>
      )}
      {result.status === "unbounded" && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          The objective grows without limit in the feasible region.
        </span>
      )}
      {result.status === "infeasible" && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          No point satisfies all constraints simultaneously.
        </span>
      )}
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
    >
      {children}
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-col gap-2 text-xs text-neutral-500 dark:text-neutral-400">
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm border border-emerald-600/70 bg-emerald-600/35" />
          Entering column
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm border border-orange-600/70 bg-orange-600/35" />
          Pivot row
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm border border-emerald-700 bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500" />
          Pivot element
        </span>
      </div>
      <p className="font-mono">
        xⱼ decision · sⱼ slack / surplus · aⱼ artificial
      </p>
    </div>
  );
}
