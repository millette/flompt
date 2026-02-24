import type { BlockType } from '@/types/blocks'

// ── Types ──────────────────────────────────────────────────────────────────

export type Locale = 'en' | 'fr'

export interface BlockTranslation {
  label: string
  description: string
}

export interface Translations {
  nodeCount: (n: number) => string
  tabs: { input: string; canvas: string; output: string }
  header: {
    undo: string
    redo: string
    reset: string
    resetConfirm: string
    autosaved: string
  }
  promptInput: {
    title: string
    placeholder: string
    decompose: string
    decomposing: string
    errorDecompose: string
    paste: string
  }
  promptOutput: {
    title: string
    compile: string
    compiling: string
    copy: string
    copied: string
    placeholder: string
    errorCompile: string
    exportTxt: string
    exportJson: string
    share: string
  }
  errors: {
    overloaded: string
    timeout: string
    network: string
    server: string
    unknown: string
  }
  sidebar: {
    title: string
    hint: string
  }
  block: {
    duplicate: string
    expand: string
    collapse: string
    delete: string
    chars: string
  }
  canvas: {
    empty: string
    emptyHint: string
    emptyDecompose: string
  }
  shortcuts: {
    title: string
    close: string
    list: { keys: string[]; label: string }[]
  }
  onboarding: {
    heading: string
    tagline: string
    step1title: string
    step1desc: string
    step2title: string
    step2desc: string
    step3title: string
    step3desc: string
    tryExample: string
    skip: string
    samplePrompt: string
  }
  blocks: Record<BlockType, BlockTranslation>
}

// ── English (default) ──────────────────────────────────────────────────────

const en: Translations = {
  nodeCount: (n) => `${n} block${n > 1 ? 's' : ''}`,
  tabs: { input: 'Prompt', canvas: 'Canvas', output: 'Result' },
  header: {
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',
    reset: 'Reset',
    resetConfirm: 'Reset the canvas?',
    autosaved: 'Auto-saved',
  },
  promptInput: {
    title: 'Raw Prompt',
    placeholder: 'Paste your prompt here…',
    decompose: 'Decompose into blocks',
    decomposing: 'Decomposing…',
    errorDecompose: 'Decomposition failed. Please try again.',
    paste: 'Paste from clipboard',
  },
  promptOutput: {
    title: 'Result',
    compile: 'Compile',
    compiling: 'Compiling…',
    copy: 'Copy',
    copied: 'Copied!',
    placeholder: 'Build your flowchart\nthen compile to see the result.',
    errorCompile: 'Compilation failed. Please try again.',
    exportTxt: '.txt',
    exportJson: '.json',
    share: 'Share flompt',
  },
  errors: {
    overloaded: 'AI is overloaded right now. Please wait a moment and try again.',
    timeout: 'Request timed out. The AI took too long to respond — try again.',
    network: 'Connection lost. Check your internet and try again.',
    server: 'Server error. Please try again in a few seconds.',
    unknown: 'Something went wrong. Please try again.',
  },
  sidebar: {
    title: 'Blocks',
    hint: 'Click to add · Drag to canvas',
  },
  block: {
    duplicate: 'Duplicate',
    expand: 'Expand',
    collapse: 'Collapse',
    delete: 'Delete',
    chars: 'ch.',
  },
  canvas: {
    empty: 'Empty canvas',
    emptyHint: 'Paste a prompt on the left and click ',
    emptyDecompose: 'Decompose, or drag a block from the sidebar.',
  },
  shortcuts: {
    title: 'Keyboard Shortcuts',
    close: 'Press Esc or ? to close',
    list: [
      { keys: ['Ctrl', 'Z'], label: 'Undo' },
      { keys: ['Ctrl', 'Y'], label: 'Redo' },
      { keys: ['Ctrl', '⇧', 'Z'], label: 'Redo (alt)' },
      { keys: ['Del'], label: 'Delete selected block' },
      { keys: ['Ctrl', 'A'], label: 'Select all' },
      { keys: ['Scroll'], label: 'Zoom in/out' },
      { keys: ['Drag'], label: 'Move a block' },
      { keys: ['Bg drag'], label: 'Pan canvas' },
      { keys: ['?'], label: 'Show shortcuts' },
    ],
  },
  onboarding: {
    heading: 'How flompt works',
    tagline: 'Build your first prompt in 3 steps.',
    step1title: 'Paste your prompt',
    step1desc: 'Drop any raw text in the left panel — no special format needed.',
    step2title: 'AI decomposes it',
    step2desc: 'Click Decompose. Blocks appear on this canvas: Role, Objective, Constraints and more.',
    step3title: 'Edit, connect, compile',
    step3desc: 'Drag blocks around, edit their content, then compile into an optimized prompt.',
    tryExample: 'Try with an example →',
    skip: 'Start from scratch',
    samplePrompt: 'You are a senior Python developer. Review the following code for bugs, performance issues, and style violations. Be concise, prioritize critical issues, and explain each finding in one sentence. Respond with a numbered list.',
  },
  blocks: {
    input:           { label: 'Input',           description: 'Data provided to the AI' },
    role:            { label: 'Role',            description: "Defines the AI's persona / role" },
    context:         { label: 'Context',         description: 'Provides context for the task' },
    objective:       { label: 'Objective',       description: 'What we want to accomplish' },
    constraints:     { label: 'Constraints',     description: 'Rules and limits to respect' },
    examples:        { label: 'Examples',        description: 'Few-shot examples' },
    chain_of_thought:{ label: 'Chain of Thought',description: 'Reasoning steps' },
    output_format:   { label: 'Output',          description: 'Expected format of the response' },
    language:        { label: 'Language',        description: 'Language the AI should respond in' },
  },
}

// ── French ─────────────────────────────────────────────────────────────────

const fr: Translations = {
  nodeCount: (n) => `${n} bloc${n > 1 ? 's' : ''}`,
  tabs: { input: 'Prompt', canvas: 'Canvas', output: 'Résultat' },
  header: {
    undo: 'Annuler (Ctrl+Z)',
    redo: 'Rétablir (Ctrl+Y)',
    reset: 'Réinitialiser',
    resetConfirm: 'Réinitialiser le canvas ?',
    autosaved: 'Sauvegardé',
  },
  promptInput: {
    title: 'Prompt brut',
    placeholder: 'Colle ton prompt ici…',
    decompose: 'Décomposer en blocs',
    decomposing: 'Décomposition…',
    errorDecompose: 'La décomposition a échoué. Réessayez.',
    paste: 'Coller depuis le presse-papiers',
  },
  promptOutput: {
    title: 'Résultat',
    compile: 'Compiler',
    compiling: 'Compilation…',
    copy: 'Copier',
    copied: 'Copié !',
    placeholder: 'Construis ton flowchart\npuis compile pour voir le résultat.',
    errorCompile: 'La compilation a échoué. Réessayez.',
    exportTxt: '.txt',
    exportJson: '.json',
    share: 'Partager flompt',
  },
  errors: {
    overloaded: 'L\'IA est surchargée. Patientez un instant et réessayez.',
    timeout: 'Délai dépassé. L\'IA a mis trop de temps — réessayez.',
    network: 'Connexion perdue. Vérifiez votre internet et réessayez.',
    server: 'Erreur serveur. Réessayez dans quelques secondes.',
    unknown: 'Une erreur est survenue. Réessayez.',
  },
  sidebar: {
    title: 'Blocs',
    hint: 'Clic pour ajouter · Glisser vers le canvas',
  },
  block: {
    duplicate: 'Dupliquer',
    expand: 'Développer',
    collapse: 'Réduire',
    delete: 'Supprimer',
    chars: 'car.',
  },
  canvas: {
    empty: 'Canvas vide',
    emptyHint: 'Colle un prompt à gauche et clique sur ',
    emptyDecompose: 'Décomposer, ou glisse un bloc depuis la sidebar.',
  },
  shortcuts: {
    title: 'Raccourcis clavier',
    close: 'Appuie sur Esc ou ? pour fermer',
    list: [
      { keys: ['Ctrl', 'Z'], label: 'Annuler' },
      { keys: ['Ctrl', 'Y'], label: 'Rétablir' },
      { keys: ['Ctrl', '⇧', 'Z'], label: 'Rétablir (alt)' },
      { keys: ['Del'], label: 'Supprimer le bloc sélectionné' },
      { keys: ['Ctrl', 'A'], label: 'Tout sélectionner' },
      { keys: ['Scroll'], label: 'Zoom in/out' },
      { keys: ['Drag'], label: 'Déplacer un bloc' },
      { keys: ['Bg drag'], label: 'Déplacer le canvas' },
      { keys: ['?'], label: 'Afficher les raccourcis' },
    ],
  },
  blocks: {
    input:           { label: 'Entrée',          description: "Données fournies à l'IA" },
    role:            { label: 'Rôle',            description: "Définit la persona / le rôle de l'IA" },
    context:         { label: 'Contexte',        description: 'Fournit le contexte de la tâche' },
    objective:       { label: 'Objectif',        description: "Ce qu'on veut accomplir" },
    constraints:     { label: 'Contraintes',     description: 'Règles et limites à respecter' },
    examples:        { label: 'Exemples',        description: 'Exemples few-shot' },
    chain_of_thought:{ label: 'Raisonnement',    description: 'Étapes de raisonnement' },
    output_format:   { label: 'Sortie',          description: 'Format attendu de la réponse' },
    language:        { label: 'Langue',          description: 'Langue de réponse de l\'IA' },
  },
  onboarding: {
    heading: 'Comment fonctionne flompt',
    tagline: 'Construis ton premier prompt en 3 étapes.',
    step1title: 'Colle ton prompt',
    step1desc: 'Dépose n\'importe quel texte dans le panneau gauche — aucun format requis.',
    step2title: 'L\'IA le décompose',
    step2desc: 'Clique sur Décomposer. Les blocs apparaissent sur ce canvas : Rôle, Objectif, Contraintes et plus.',
    step3title: 'Édite, connecte, compile',
    step3desc: 'Déplace les blocs, affine leur contenu, puis compile en prompt optimisé.',
    tryExample: 'Essayer avec un exemple →',
    skip: 'Commencer from zéro',
    samplePrompt: 'Tu es un expert en rédaction de contenu. Écris une bio professionnelle pour un développeur fullstack avec 5 ans d\'expérience en React et Python. Sois concis, accrocheur et professionnel. Maximum 150 mots. Inclus ses technologies principales et un trait de personnalité.',
  },
}

export const translations: Record<Locale, Translations> = { en, fr }
