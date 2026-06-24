/** Formats a number for compact tableau display. */
export function fmt(n: number): string {
  if (Number.isNaN(n)) return "-";
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
  const r = Math.round(n * 1000) / 1000;
  if (Object.is(r, -0) || r === 0) return "0";
  return String(r);
}

/** Builds a human-readable linear term like "3·x1" or "-x2". */
export function term(coeff: number, name: string): string {
  if (coeff === 1) return name;
  if (coeff === -1) return `-${name}`;
  return `${fmt(coeff)}·${name}`;
}

/** Joins terms into "3·x1 + 2·x2 - x3", dropping zero coefficients. */
export function linearExpr(coeffs: number[], names: string[]): string {
  const parts: string[] = [];
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const sign = c < 0 ? "-" : parts.length ? "+" : "";
    const abs = Math.abs(c);
    const body = abs === 1 ? names[i] : `${fmt(abs)}·${names[i]}`;
    parts.push(`${sign} ${body}`.trim());
  });
  return parts.length ? parts.join(" ") : "0";
}
