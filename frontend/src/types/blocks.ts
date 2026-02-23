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

export const BLOCK_META: Record<BlockType, { label: string; description: string; color: string }> = {
  role: {
    label: 'Role',
    description: "Définit la persona / le rôle de l'IA",
    color: '#6366f1',
  },
  context: {
    label: 'Context',
    description: 'Fournit le contexte de la tâche',
    color: '#0ea5e9',
  },
  objective: {
    label: 'Objective',
    description: "Ce qu'on veut accomplir",
    color: '#10b981',
  },
  input: {
    label: 'Input',
    description: "Données fournies à l'IA",
    color: '#f59e0b',
  },
  constraints: {
    label: 'Constraints',
    description: 'Règles et limites à respecter',
    color: '#ef4444',
  },
  output_format: {
    label: 'Output Format',
    description: 'Format attendu de la réponse',
    color: '#8b5cf6',
  },
  examples: {
    label: 'Examples',
    description: 'Few-shot examples',
    color: '#ec4899',
  },
  chain_of_thought: {
    label: 'Chain of Thought',
    description: 'Étapes de raisonnement',
    color: '#14b8a6',
  },
}

// ─── Compiled Prompt ─────────────────────────────────────────────────────────

export interface CompiledPrompt {
  raw: string
  tokenEstimate: number
  blocks: BlockData[]
}
