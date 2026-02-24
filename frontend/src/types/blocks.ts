import {
  UserRound,
  Layers,
  Target,
  LogIn,
  ShieldAlert,
  LogOut,
  Lightbulb,
  GitBranch,
  Globe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Block Types ────────────────────────────────────────────────────────────

export type BlockType =
  | 'role'
  | 'context'
  | 'objective'
  | 'input'
  | 'constraints'
  | 'output_format'
  | 'examples'
  | 'chain_of_thought'
  | 'language'

export interface BlockData {
  type: BlockType
  label: string
  content: string
  description: string
  summary?: string
}

export interface FlomptNode {
  id: string
  type: 'block'
  position: { x: number; y: number }
  data: BlockData
}

export interface FlomptEdge {
  id: string
  source: string
  target: string
  animated?: boolean
}

// ─── Block Metadata ──────────────────────────────────────────────────────────

// Palette harmonisée DA Mermaid — tons doux sur fond sombre, accent pink #FF3570
export const BLOCK_META: Record<BlockType, { label: string; description: string; color: string; icon: LucideIcon }> = {
  input: {
    label: 'Entrée',
    description: "Données fournies à l'IA",
    color: '#4ade80',   // green-400 — signal « start »
    icon: LogIn,
  },
  role: {
    label: 'Rôle',
    description: "Définit la persona / le rôle de l'IA",
    color: '#c084fc',   // violet-400 — persona
    icon: UserRound,
  },
  context: {
    label: 'Contexte',
    description: 'Fournit le contexte de la tâche',
    color: '#94a3b8',   // slate-400 — neutre, informatif
    icon: Layers,
  },
  objective: {
    label: 'Objectif',
    description: "Ce qu'on veut accomplir",
    color: '#fbbf24',   // amber-400 — cible, chaleureux
    icon: Target,
  },
  constraints: {
    label: 'Contraintes',
    description: 'Règles et limites à respecter',
    color: '#fb7185',   // rose-400 — proche accent Mermaid
    icon: ShieldAlert,
  },
  examples: {
    label: 'Exemples',
    description: 'Exemples few-shot',
    color: '#c4b5fd',   // violet-300 — doux, pédagogique
    icon: Lightbulb,
  },
  chain_of_thought: {
    label: 'Raisonnement',
    description: 'Étapes de raisonnement',
    color: '#67e8f9',   // cyan-300 — logique, réflexion
    icon: GitBranch,
  },
  output_format: {
    label: 'Sortie',
    description: 'Format attendu de la réponse',
    color: '#ff6b9d',   // accent-light — signal « fin », aligné DA
    icon: LogOut,
  },
  language: {
    label: 'Langue',
    description: 'Langue de réponse de l\'IA',
    color: '#38bdf8',   // sky-400 — international, communication
    icon: Globe,
  },
}

// ─── Compiled Prompt ─────────────────────────────────────────────────────────

export interface CompiledPrompt {
  raw: string
  tokenEstimate: number
  blocks: BlockData[]
}
