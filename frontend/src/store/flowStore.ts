import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { Connection, NodeChange, EdgeChange } from 'reactflow'
import type { FlomptNode, FlomptEdge, CompiledPrompt } from '@/types/blocks'

interface FlowState {
  nodes: FlomptNode[]
  edges: FlomptEdge[]
  rawPrompt: string
  compiledPrompt: CompiledPrompt | null
  isDecomposing: boolean
  isCompiling: boolean

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
}

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [],
  edges: [],
  rawPrompt: '',
  compiledPrompt: null,
  isDecomposing: false,
  isCompiling: false,

  setRawPrompt: (prompt) => set({ rawPrompt: prompt }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

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
      edges: addEdge({ ...connection, animated: true }, state.edges) as FlomptEdge[],
    })),

  updateNodeContent: (id, content) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, content } } : n
      ),
    })),

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
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
    }),
}))
