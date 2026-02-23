import axios from 'axios'
import type { BlockData, CompiledPrompt, FlomptNode, FlomptEdge } from '@/types/blocks'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

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

// ─── Compile ─────────────────────────────────────────────────────────────────
// POST /api/compile
// Input  : ordered list of blocks
// Output : optimized machine-readable prompt + token estimate

export interface CompileRequest {
  blocks: BlockData[]
}

export const compilePrompt = async (blocks: BlockData[]): Promise<CompiledPrompt> => {
  const { data } = await client.post<CompiledPrompt>('/compile', { blocks })
  return data
}
