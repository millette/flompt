import axios, { AxiosError } from 'axios'
import type { FlomptNode, FlomptEdge } from '@/types/blocks'

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

/** Classifie une erreur backend retournée via le job store (string). */
export function classifyJobError(errorMsg: string): ApiErrorType {
  const msg = errorMsg.toLowerCase()
  if (msg.includes('529') || msg.includes('overloaded')) return 'overloaded'
  if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout'
  if (msg.includes('network') || msg.includes('connection')) return 'network'
  return 'server'
}

// ─── Decompose (async / fire-and-forget) ─────────────────────────────────────
// POST /api/decompose → retourne immédiatement { job_id, status, position }
// GET  /api/queue/job/{job_id} → poll jusqu'à status="done" pour récupérer le résultat

export interface DecomposeResponse {
  nodes: FlomptNode[]
  edges: FlomptEdge[]
}

/** Réponse immédiate du POST /api/decompose. */
export interface DecomposeJobStarted {
  job_id: string
  status: 'queued'
  position: number
}

/** Réponse du GET /api/queue/job/{job_id} au fil du polling. */
export interface JobPollResponse {
  job_id: string
  status: 'queued' | 'processing' | 'done' | 'error' | 'unknown'
  position?: number | null
  result?: DecomposeResponse   // présent quand status === 'done'
  error?: string               // présent quand status === 'error'
}

/** Soumet le job — retourne immédiatement avec job_id et position estimée. */
export const decomposePrompt = async (rawPrompt: string, jobId: string): Promise<DecomposeJobStarted> => {
  const { data } = await client.post<DecomposeJobStarted>('/decompose', { prompt: rawPrompt, job_id: jobId })
  return data
}

/** Poll le statut et (éventuellement) le résultat d'un job. */
export const getJobStatus = async (jobId: string): Promise<JobPollResponse> => {
  const { data } = await client.get<JobPollResponse>(`/queue/job/${jobId}`)
  return data
}

// compilePrompt supprimé — l'assemblage est désormais 100% local (voir PromptOutput.tsx)
