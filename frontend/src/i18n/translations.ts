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
    errorDecompose: 'Decomposition error. Make sure the backend is running.',
    paste: 'Paste from clipboard',
  },
  promptOutput: {
    title: 'Result',
    compile: 'Compile',
    compiling: 'Compiling…',
    copy: 'Copy',
    copied: 'Copied!',
    placeholder: 'Build your flowchart\nthen compile to see the result.',
    errorCompile: 'Compilation error. Make sure the backend is running.',
    exportTxt: '.txt',
    exportJson: '.json',
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
  blocks: {
    input:           { label: 'Input',           description: 'Data provided to the AI' },
    role:            { label: 'Role',            description: "Defines the AI's persona / role" },
    context:         { label: 'Context',         description: 'Provides context for the task' },
    objective:       { label: 'Objective',       description: 'What we want to accomplish' },
    constraints:     { label: 'Constraints',     description: 'Rules and limits to respect' },
    examples:        { label: 'Examples',        description: 'Few-shot examples' },
    chain_of_thought:{ label: 'Chain of Thought',description: 'Reasoning steps' },
    output_format:   { label: 'Output',          description: 'Expected format of the response' },
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
    errorDecompose: 'Erreur lors de la décomposition. Vérifiez que le backend est lancé.',
    paste: 'Coller depuis le presse-papiers',
  },
  promptOutput: {
    title: 'Résultat',
    compile: 'Compiler',
    compiling: 'Compilation…',
    copy: 'Copier',
    copied: 'Copié !',
    placeholder: 'Construis ton flowchart\npuis compile pour voir le résultat.',
    errorCompile: 'Erreur lors de la compilation. Vérifiez que le backend est lancé.',
    exportTxt: '.txt',
    exportJson: '.json',
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
  },
}

export const translations: Record<Locale, Translations> = { en, fr }
