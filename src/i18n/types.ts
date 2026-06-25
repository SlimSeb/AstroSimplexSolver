import type { IterationNote } from "../lib/simplex";

/** URL-facing locale codes (kept short for clean paths). */
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Per-locale metadata used for SEO and the language switcher. */
export interface LocaleMeta {
  /** BCP-47 tag for the <html lang> attribute and hreflang. */
  htmlLang: string;
  /** Open Graph locale, e.g. "en_US". */
  ogLocale: string;
  /** Endonym shown in the language switcher. */
  label: string;
  /** Short two-letter badge. */
  short: string;
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: { htmlLang: "en-US", ogLocale: "en_US", label: "English", short: "EN" },
  fr: { htmlLang: "fr-FR", ogLocale: "fr_FR", label: "Français", short: "FR" },
};

/** Shape every locale dictionary must satisfy. */
export interface Messages {
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
  header: {
    eyebrow: string;
    title: string;
    intro: string;
  };
  footer: { builtWith: string };
  themeToggle: { aria: string };
  langSwitcher: { aria: string };
  solver: {
    defineProblem: string;
    loadExample: string;
    objectiveLabel: string;
    senseMax: string;
    senseMin: string;
    addVariable: string;
    removeVariable: string;
    subjectTo: string;
    /** Receives the joined variable list, e.g. "x1, x2". */
    nonNegativity: (vars: string) => string;
    addConstraint: string;
    removeConstraint: string;
    solve: string;
    result: string;
    status: {
      optimal: string;
      unbounded: string;
      infeasible: string;
    };
    unboundedMessage: string;
    infeasibleMessage: string;
    phase: (n: number) => string;
    iteration: (current: number, total: number) => string;
    legend: {
      enteringColumn: string;
      pivotRow: string;
      pivotElement: string;
      variableKinds: string;
    };
  };
  tableau: {
    basis: string;
    rhs: string;
  };
  presets: Record<string, { label: string; description: string }>;
  /** Turns a structured solver note into a translated sentence. */
  note: (note: IterationNote) => string;
}
