import axios, { AxiosError } from 'axios'
import type { FlomptNode, FlomptEdge, BlockData } from '@/types/blocks'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Error classification ────────────────────────────────────────────────────

export type ApiErrorType = 'overloaded' | 'timeout' | 'network' | 'server' | 'unknown'

export function classifyError(e: unknown): ApiErrorType {
  if (e instanceof AxiosError) {
    const status = e.response?.status
    const detail = (e.response?.data as { detail?: string })?.detail ?? ''
    if (status === 529 || status === 503 || detail.includes('529') || detail.includes('overloaded')) return 'overloaded'
    if (status === 429) return 'overloaded'
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT' || status === 504) return 'timeout'
    if (e.code === 'ERR_NETWORK' || !e.response) return 'network'
    if (status && status >= 500) return 'server'
  }
  return 'unknown'
}

// ─── Decompose ───────────────────────────────────────────────────────────────
// POST /api/decompose
// Input  : raw prompt string
// Output : list of blocks + suggested edges

export interface DecomposeResponse {
  nodes: FlomptNode[]
  edges: FlomptEdge[]
}

export const decomposePrompt = async (rawPrompt: string): Promise<DecomposeResponse> => {
  const { data } = await client.post<DecomposeResponse>('/decompose', { prompt: rawPrompt })
  return data
}

// ─── Compile (AI-powered) ────────────────────────────────────────────────────
// POST /api/compile
// Input  : list of blocks (BlockData[])
// Output : optimized prompt string + token estimate
//
// Utilise Claude pour réécrire le prompt de manière naturelle et optimisée.
// Plus lent que l'assemblage local mais produit un meilleur résultat final.

export interface CompileResponse {
  raw: string
  tokenEstimate: number
  blocks: BlockData[]
}

export const compilePrompt = async (blocks: BlockData[]): Promise<CompileResponse> => {
  const { data } = await client.post<CompileResponse>('/compile', { blocks })
  return data
}
