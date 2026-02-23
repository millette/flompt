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

export const BLOCK_META: Record<BlockType, { label: string; description: string; color: string; icon: string }> = {
  role: {
    label: 'Role',
    description: "Définit la persona / le rôle de l'IA",
    color: '#7c3aed',
    icon: '🎭',
  },
  context: {
    label: 'Context',
    description: 'Fournit le contexte de la tâche',
    color: '#0ea5e9',
    icon: '📋',
  },
  objective: {
    label: 'Objective',
    description: "Ce qu'on veut accomplir",
    color: '#10b981',
    icon: '🎯',
  },
  input: {
    label: 'Input',
    description: "Données fournies à l'IA",
    color: '#f59e0b',
    icon: '📥',
  },
  constraints: {
    label: 'Constraints',
    description: 'Règles et limites à respecter',
    color: '#ef4444',
    icon: '⛔',
  },
  output_format: {
    label: 'Output Format',
    description: 'Format attendu de la réponse',
    color: '#8b5cf6',
    icon: '📄',
  },
  examples: {
    label: 'Examples',
    description: 'Few-shot examples',
    color: '#ec4899',
    icon: '💡',
  },
  chain_of_thought: {
    label: 'Chain of Thought',
    description: 'Étapes de raisonnement',
    color: '#14b8a6',
    icon: '🔗',
  },
}

// ─── Compiled Prompt ─────────────────────────────────────────────────────────

export interface CompiledPrompt {
  raw: string
  tokenEstimate: number
  blocks: BlockData[]
}
