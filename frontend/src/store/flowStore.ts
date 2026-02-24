import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { Connection, NodeChange, EdgeChange } from 'reactflow'
import type { FlomptNode, FlomptEdge, CompiledPrompt } from '@/types/blocks'

// ── Snapshot type pour undo/redo ─────────────────────────────────────────────
interface Snapshot {
  nodes: FlomptNode[]
  edges: FlomptEdge[]
}

interface FlowState {
  nodes: FlomptNode[]
  edges: FlomptEdge[]
  rawPrompt: string
  compiledPrompt: CompiledPrompt | null
  isDecomposing: boolean
  isCompiling: boolean
  lastSaved: number | null  // timestamp ms

  // Historique undo/redo
  past: Snapshot[]
  future: Snapshot[]

  // Actions
  setRawPrompt: (prompt: string) => void
  setNodes: (nodes: FlomptNode[]) => void
  setEdges: (edges: FlomptEdge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  updateNodeContent: (id: string, content: string) => void
  addNode: (node: FlomptNode) => void
  removeNode: (id: string) => void
  setCompiledPrompt: (prompt: CompiledPrompt | null) => void
  setIsDecomposing: (v: boolean) => void
  setIsCompiling: (v: boolean) => void
  reset: () => void
  undo: () => void
  redo: () => void
}

const snapshot = (state: FlowState): Snapshot => ({
  nodes: state.nodes,
  edges: state.edges,
})

const MAX_HISTORY = 30

export const useFlowStore = create<FlowState>()(
  persist(
    (set) => ({
      nodes: [],
      edges: [],
      rawPrompt: '',
      compiledPrompt: null,
      isDecomposing: false,
      isCompiling: false,
      lastSaved: null,
      past: [],
      future: [],

      setRawPrompt: (prompt) => set({ rawPrompt: prompt }),

      setNodes: (nodes) =>
        set((state) => ({
          past: [...state.past.slice(-MAX_HISTORY), snapshot(state)],
          future: [],
          nodes,
          lastSaved: Date.now(),
        })),

      setEdges: (edges) =>
        set((state) => ({
          past: [...state.past.slice(-MAX_HISTORY), snapshot(state)],
          future: [],
          edges,
          lastSaved: Date.now(),
        })),

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as FlomptNode[],
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges) as FlomptEdge[],
        })),

      onConnect: (connection) =>
        set((state) => ({
          edges: addEdge({ ...connection, type: 'custom' }, state.edges) as FlomptEdge[],
          lastSaved: Date.now(),
        })),

      updateNodeContent: (id, content) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, content } } : n
          ),
        })),

      addNode: (node) =>
        set((state) => ({
          past: [...state.past.slice(-MAX_HISTORY), snapshot(state)],
          future: [],
          nodes: [...state.nodes, node],
          lastSaved: Date.now(),
        })),

      removeNode: (id) =>
        set((state) => ({
          past: [...state.past.slice(-MAX_HISTORY), snapshot(state)],
          future: [],
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          lastSaved: Date.now(),
        })),

      setCompiledPrompt: (prompt) => set({ compiledPrompt: prompt }),
      setIsDecomposing: (v) => set({ isDecomposing: v }),
      setIsCompiling: (v) => set({ isCompiling: v }),

      reset: () =>
        set({
          nodes: [],
          edges: [],
          rawPrompt: '',
          compiledPrompt: null,
          past: [],
          future: [],
        }),

      undo: () =>
        set((state) => {
          if (state.past.length === 0) return state
          const prev = state.past[state.past.length - 1]
          return {
            past: state.past.slice(0, -1),
            future: [snapshot(state), ...state.future].slice(0, MAX_HISTORY),
            nodes: prev.nodes,
            edges: prev.edges,
          }
        }),

      redo: () =>
        set((state) => {
          if (state.future.length === 0) return state
          const next = state.future[0]
          return {
            past: [...state.past.slice(-MAX_HISTORY), snapshot(state)],
            future: state.future.slice(1),
            nodes: next.nodes,
            edges: next.edges,
          }
        }),
    }),
    {
      name: 'flompt-session',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        rawPrompt: state.rawPrompt,
        compiledPrompt: state.compiledPrompt,
        // isDecomposing / isCompiling / past / future : états transitoires, non persistés
      }),
    }
  )
)
