// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import reactHooks from "eslint-plugin-react-hooks";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

/**
 * Stylistic rules encoding the conventions already used in this codebase:
 * double quotes, semicolons, 2-space indentation and trailing commas.
 */
const stylisticRules = {
  "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
  "@stylistic/jsx-quotes": ["error", "prefer-double"],
  "@stylistic/semi": ["error", "always"],
  "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
  "@stylistic/comma-dangle": ["error", "always-multiline"],
  "@stylistic/object-curly-spacing": ["error", "always"],
  "@stylistic/arrow-parens": ["error", "always"],
  "@stylistic/eol-last": ["error", "always"],
  "@stylistic/no-trailing-spaces": "error",
  "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
};

export default tseslint.config(
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // TypeScript / React island sources.
  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "@stylistic": stylistic,
    },
    rules: {
      // TypeScript already reports undefined identifiers and type-only refs.
      "no-undef": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      ...stylisticRules,
    },
  },
);
