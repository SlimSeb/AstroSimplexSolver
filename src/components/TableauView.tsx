import { motion } from "framer-motion";
import type { ColumnKind, SimplexIteration } from "../lib/simplex";
import { fmt } from "../lib/format";

interface Props {
  iteration: SimplexIteration;
  columnNames: string[];
  columnKinds: ColumnKind[];
}

export default function TableauView({ iteration, columnNames, columnKinds }: Props) {
  const { rows, objectiveRow, basis, entering, pivotRow, pivotCol } = iteration;
  const nCols = columnNames.length;

  // Added (non-structural) columns are de-emphasised with muted text.
  const headerTone = (c: number) =>
    columnKinds[c] === "structural"
      ? "text-neutral-900 dark:text-neutral-100"
      : "text-neutral-400 dark:text-neutral-500";

  const cellBg = (r: number, c: number): string => {
    if (r === pivotRow && c === pivotCol)
      return "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900";
    if (c === entering) return "bg-neutral-200/70 dark:bg-neutral-800/70";
    if (pivotRow !== null && r === pivotRow) return "bg-neutral-100 dark:bg-neutral-800/40";
    return "";
  };

  return (
    <div className="tableau-scroll overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="w-full border-collapse text-right font-mono text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <th className="px-3 py-2 text-left font-medium">Basis</th>
            {columnNames.map((name, c) => (
              <th
                key={name}
                className={`px-3 py-2 font-semibold ${headerTone(c)} ${
                  c === entering ? "bg-neutral-200/70 dark:bg-neutral-800/70" : ""
                }`}
              >
                {name}
                {c === entering && <span className="ml-1">↓</span>}
              </th>
            ))}
            <th className="px-3 py-2 font-medium text-neutral-600 dark:text-neutral-300">
              RHS
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const isPivotRow = r === pivotRow;
            return (
              <motion.tr
                key={`row-${r}`}
                layout
                className="border-b border-neutral-100 text-neutral-700 dark:border-neutral-800/60 dark:text-neutral-200"
              >
                <td className="px-3 py-1.5 text-left font-semibold text-neutral-600 dark:text-neutral-300">
                  {columnNames[basis[r]] ?? "?"}
                  {isPivotRow && <span className="ml-1">←</span>}
                </td>
                {row.slice(0, nCols).map((value, c) => (
                  <td key={c} className={`px-3 py-1.5 tabular-nums ${cellBg(r, c)}`}>
                    <motion.span
                      key={`${r}-${c}-${value}`}
                      initial={{ opacity: 0.3, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="inline-block"
                    >
                      {fmt(value)}
                    </motion.span>
                  </td>
                ))}
                <td className="px-3 py-1.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {fmt(row[nCols])}
                </td>
              </motion.tr>
            );
          })}

          {/* Objective / reduced-cost row */}
          <tr className="border-t-2 border-neutral-300 bg-neutral-100/60 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-300">
            <td className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              {iteration.phase === 1 ? "w (cj−zj)" : "z (cj−zj)"}
            </td>
            {objectiveRow.slice(0, nCols).map((value, c) => (
              <td
                key={c}
                className={`px-3 py-2 tabular-nums ${
                  c === entering ? "bg-neutral-200/70 dark:bg-neutral-800/70" : ""
                } ${
                  value > 1e-9
                    ? "font-semibold text-neutral-900 underline decoration-dotted underline-offset-4 dark:text-neutral-100"
                    : ""
                }`}
              >
                {fmt(value)}
              </td>
            ))}
            <td className="px-3 py-2 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {fmt(-objectiveRow[nCols])}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
