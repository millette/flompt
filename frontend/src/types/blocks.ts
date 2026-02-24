import {
  UserRound,
  Layers,
  Target,
  LogIn,
  ShieldAlert,
  LayoutList,
  Lightbulb,
  GitBranch,
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

export interface BlockData {
  type: BlockType
  label: string
  content: string
  description: string
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

// Palette Tailwind-400 harmonisée — teintes pastel sur fond sombre Mermaid
export const BLOCK_META: Record<BlockType, { label: string; description: string; color: string; icon: LucideIcon }> = {
  role: {
    label: 'Role',
    description: "Définit la persona / le rôle de l'IA",
    color: '#c084fc',   // violet-400 — famille rose Mermaid
    icon: UserRound,
  },
  context: {
    label: 'Context',
    description: 'Fournit le contexte de la tâche',
    color: '#818cf8',   // indigo-400 — neutre cool
    icon: Layers,
  },
  objective: {
    label: 'Objective',
    description: "Ce qu'on veut accomplir",
    color: '#34d399',   // emerald-400 — frais, distinct
    icon: Target,
  },
  input: {
    label: 'Input',
    description: "Données fournies à l'IA",
    color: '#fb923c',   // orange-400 — chaud, lisible
    icon: LogIn,
  },
  constraints: {
    label: 'Constraints',
    description: 'Règles et limites à respecter',
    color: '#fb7185',   // rose-400 — proche accent Mermaid
    icon: ShieldAlert,
  },
  output_format: {
    label: 'Output Format',
    description: 'Format attendu de la réponse',
    color: '#60a5fa',   // blue-400 — distinct de indigo
    icon: LayoutList,
  },
  examples: {
    label: 'Examples',
    description: 'Few-shot examples',
    color: '#f472b6',   // pink-400 — très proche Mermaid #FF3570
    icon: Lightbulb,
  },
  chain_of_thought: {
    label: 'Chain of Thought',
    description: 'Étapes de raisonnement',
    color: '#22d3ee',   // cyan-400 — contraste froid propre
    icon: GitBranch,
  },
}

// ─── Compiled Prompt ─────────────────────────────────────────────────────────

export interface CompiledPrompt {
  raw: string
  tokenEstimate: number
  blocks: BlockData[]
}
