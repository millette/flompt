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
    importFromPlatform: string
    queuePosition: (n: number) => string
    queueProcessing: string
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
  tour: {
    step1title: string
    step1desc: string
    stepBlocksTitle: string
    stepBlocksDesc: string
    step2title: string
    step2desc: string
    step2action: string
    step3title: string
    step3desc: string
    step4title: string
    step4desc: string
    stepOf: string
    next: string
    finish: string
    skip: string
    acting: string
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
    importFromPlatform: 'Import prompt from page',
    queuePosition: (n) => `Queue position: ${n}`,
    queueProcessing: 'Processing…',
  },
  promptOutput: {
    title: 'Result',
    compile: 'Assemble prompt',
    compiling: 'Assembling…',
    copy: 'Copy',
    copied: 'Copied!',
    placeholder: 'Build your flowchart\nthen assemble to generate the prompt.',
    errorCompile: 'Assembly failed. Please try again.',
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
  tour: {
    step1title: 'Your raw prompt',
    step1desc: "Type or paste any text here — vague or detailed, it doesn't matter. flompt will structure it for you.",
    stepBlocksTitle: 'The building blocks',
    stepBlocksDesc: 'Each block type targets one part of your prompt: Role, Objective, Constraints, Output Format… Click to add one, or drag it onto the canvas.',
    step2title: 'Decompose into blocks',
    step2desc: 'flompt sends your prompt to the AI, which breaks it into typed blocks: Role, Objective, Constraints and more.',
    step2action: 'Decompose for me',
    step3title: 'Edit your blocks',
    step3desc: 'Each block is one aspect of your prompt. Edit the content, reorder by dragging, and add blocks from the left sidebar.',
    step4title: 'Compile',
    step4desc: 'Hit Compile to generate your final prompt — structured, optimized, ready to paste into any LLM.',
    stepOf: '{n} / {total}',
    next: 'Next',
    finish: 'Got it',
    skip: 'Skip',
    acting: 'Decomposing…',
    samplePrompt: 'You are a senior Python developer. Review the following code for bugs, performance issues, and style violations. Be concise, prioritize critical issues, and explain each finding in one sentence. Respond with a numbered list.',
  },
  blocks: {
    document:        { label: 'Document',        description: 'External content injected via XML <document>' },
    input:           { label: 'Input',           description: 'Data provided to the AI' },
    role:            { label: 'Role',            description: "Defines the AI's persona / role" },
    context:         { label: 'Context',         description: 'Provides context for the task' },
    objective:       { label: 'Objective',       description: 'What we want to accomplish' },
    constraints:     { label: 'Constraints',     description: 'Rules and limits to respect' },
    examples:        { label: 'Examples',        description: 'Few-shot input/output pairs' },
    chain_of_thought:{ label: 'Chain of Thought',description: 'Step-by-step reasoning instructions' },
    output_format:   { label: 'Output',          description: 'Expected format of the response' },
    format_control:  { label: 'Format Control',  description: 'Claude directives: tone, verbosity, markdown' },
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
    importFromPlatform: 'Importer le prompt depuis la page',
    queuePosition: (n) => `Position dans la file : ${n}`,
    queueProcessing: 'Traitement en cours…',
  },
  promptOutput: {
    title: 'Résultat',
    compile: 'Assembler le prompt',
    compiling: 'Assemblage…',
    copy: 'Copier',
    copied: 'Copié !',
    placeholder: 'Construis ton flowchart\npuis assemble pour générer le prompt.',
    errorCompile: 'L\'assemblage a échoué. Réessayez.',
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
    document:        { label: 'Document',        description: "Contenu externe injecté en XML <document>" },
    input:           { label: 'Entrée',          description: "Données fournies à l'IA" },
    role:            { label: 'Rôle',            description: "Définit la persona / le rôle de l'IA" },
    context:         { label: 'Contexte',        description: 'Fournit le contexte de la tâche' },
    objective:       { label: 'Objectif',        description: "Ce qu'on veut accomplir" },
    constraints:     { label: 'Contraintes',     description: 'Règles et limites à respecter' },
    examples:        { label: 'Exemples',        description: 'Paires input/output few-shot' },
    chain_of_thought:{ label: 'Raisonnement',    description: 'Instructions de raisonnement pas à pas' },
    output_format:   { label: 'Sortie',          description: 'Format attendu de la réponse' },
    format_control:  { label: 'Format Control',  description: 'Directives Claude : ton, verbosité, markdown' },
    language:        { label: 'Langue',          description: 'Langue de réponse de l\'IA' },
  },
  tour: {
    step1title: 'Ton prompt brut',
    step1desc: "Tape ou colle n'importe quel texte ici — vague ou détaillé, peu importe. flompt se charge de le structurer.",
    stepBlocksTitle: 'Les blocs disponibles',
    stepBlocksDesc: "Chaque type de bloc cible un aspect de ton prompt : Rôle, Objectif, Contraintes, Format de sortie… Clique pour en ajouter un, ou glisse-le sur le canvas.",
    step2title: 'Décomposer en blocs',
    step2desc: "flompt envoie ton prompt à l'IA, qui le découpe en blocs typés : Rôle, Objectif, Contraintes…",
    step2action: 'Décomposer pour moi',
    step3title: 'Tes blocs sur le canvas',
    step3desc: "Chaque bloc représente un aspect de ton prompt. Édite le contenu, réorganise par glisser-déposer, ajoute des blocs depuis la sidebar.",
    step4title: 'Compiler',
    step4desc: "Clique sur Compiler pour générer ton prompt final — structuré, optimisé, prêt à coller dans n'importe quel LLM.",
    stepOf: '{n} / {total}',
    next: 'Suivant',
    finish: 'Compris',
    skip: 'Passer',
    acting: 'Décomposition…',
    samplePrompt: 'Tu es un développeur Python senior. Fais une revue du code suivant : identifie les bugs, les problèmes de performance et les violations de style. Sois concis, priorise les problèmes critiques, et explique chaque point en une phrase. Réponds avec une liste numérotée.',
  },
}

export const translations: Record<Locale, Translations> = { en, fr }
