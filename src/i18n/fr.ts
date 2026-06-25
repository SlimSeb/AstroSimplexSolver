import type { Messages } from "./types";

export const fr: Messages = {
  meta: {
    title: "Solveur du Simplexe · Calculateur de programmation linéaire",
    description:
      "Solveur interactif et gratuit de la méthode du simplexe pour la programmation linéaire. Définissez un objectif à maximiser ou minimiser avec des contraintes ≤, ≥ et =, puis déroulez chaque pivot du tableau du simplexe à deux phases.",
    keywords:
      "méthode du simplexe, programmation linéaire, simplexe deux phases, solveur PL, tableau du simplexe, recherche opérationnelle, calculateur d'optimisation",
  },
  header: {
    eyebrow: "Programmation linéaire · Méthode à deux phases",
    title: "Solveur du Simplexe",
    intro:
      "Construisez un programme linéaire, lancez la résolution et déroulez chaque pivot du simplexe. Gère la maximisation et la minimisation avec des contraintes ≤, ≥ et = ; les variables artificielles et la phase 1 sont ajoutées automatiquement si nécessaire.",
  },
  footer: { builtWith: "Réalisé avec Astro · React · Tailwind · Framer Motion" },
  themeToggle: { aria: "Changer le thème de couleur" },
  langSwitcher: { aria: "Choisir la langue" },
  solver: {
    defineProblem: "Définir le problème",
    loadExample: "Charger un exemple…",
    objectiveLabel: "Z =",
    senseMax: "max",
    senseMin: "min",
    addVariable: "Ajouter une variable",
    removeVariable: "Supprimer une variable",
    subjectTo: "Sous contraintes",
    nonNegativity: (vars) => `avec ${vars} ≥ 0`,
    addConstraint: "+ Ajouter une contrainte",
    removeConstraint: "Supprimer la contrainte",
    solve: "Résoudre",
    result: "Résultat",
    status: {
      optimal: "optimal",
      unbounded: "non borné",
      infeasible: "irréalisable",
    },
    unboundedMessage: "L'objectif croît sans limite dans la région réalisable.",
    infeasibleMessage: "Aucun point ne satisfait toutes les contraintes simultanément.",
    phase: (n) => `Phase ${n}`,
    iteration: (current, total) => `Itération ${current} / ${total}`,
    legend: {
      enteringColumn: "Colonne entrante",
      pivotRow: "Ligne de pivot",
      pivotElement: "Élément pivot",
      variableKinds: "xⱼ décision · sⱼ écart / surplus · aⱼ artificielle",
    },
  },
  tableau: {
    basis: "Base",
    rhs: "2ⁿᵈ membre",
  },
  presets: {
    wyndor: {
      label: "Mix de production (max)",
      description: "Maximisation classique à deux variables avec trois limites de ressources.",
    },
    blend: {
      label: "Mélange diététique (min, deux phases)",
      description: "Minimisation mêlant des contraintes =, <= et >=, nécessite la phase 1.",
    },
    "three-var": {
      label: "Trois produits (max)",
      description: "Trois variables de décision et deux contraintes partagées.",
    },
  },
  note: (note) => {
    switch (note.kind) {
      case "optimal":
        return `Phase ${note.phase} optimale : aucune variable entrante n'améliore l'objectif.`;
      case "unbounded":
        return `La colonne ${note.column} peut croître sans borne, le problème est non borné.`;
      case "pivot":
        return `Phase ${note.phase} : ${note.entering} entre, ${note.leaving} sort (pivot sur la ligne ${note.row}).`;
      case "iteration-limit":
        return "Limite d'itérations atteinte.";
    }
  },
};
