import { useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { ArrowRight, Loader } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import BlockNode from './BlockNode'
import CustomEdge from './CustomEdge'
import { BLOCK_META } from '@/types/blocks'
import type { BlockType, FlomptNode } from '@/types/blocks'
import { useLocale } from '@/i18n/LocaleContext'

const nodeTypes = { block: BlockNode }
const edgeTypes = { custom: CustomEdge }

const CanvasInner = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, isDecomposing, addNode, setActiveTab } = useFlowStore()
  const { t } = useLocale()
  const { fitView, screenToFlowPosition } = useReactFlow()
  const prevNodeCount = useRef(nodes.length)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Auto-fit quand les noeuds changent (décomposition)
  useEffect(() => {
    if (nodes.length > 0 && nodes.length !== prevNodeCount.current) {
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50)
    }
    prevNodeCount.current = nodes.length
  }, [nodes.length, fitView])

  // Drag-and-drop depuis la sidebar
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('blockType') as BlockType
    if (!type || !BLOCK_META[type]) return
    const bounds = wrapperRef.current?.getBoundingClientRect()
    if (!bounds) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const tr = t.blocks[type]
    const newNode: FlomptNode = {
      id: `${type}-${Date.now()}`,
      type: 'block',
      position,
      data: { type, label: tr.label, content: '', description: tr.description },
    }
    addNode(newNode)
  }, [screenToFlowPosition, addNode, t.blocks])

  return (
    <div className="flow-canvas" ref={wrapperRef} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode="Delete"
        snapToGrid
        snapGrid={[20, 20]}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={true}
        defaultEdgeOptions={{ type: 'custom' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e1e3a" />
        <Controls />
        <MiniMap
          nodeColor={(n) => BLOCK_META[(n.data as { type: BlockType }).type]?.color ?? '#7c3aed'}
          style={{ background: 'rgba(7, 7, 26, 0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}
        />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && !isDecomposing && (
        <div className="canvas-empty">
          <div className="canvas-empty-icon">⬡</div>
          <p className="canvas-empty-title">{t.canvas.empty}</p>
          <p className="canvas-empty-hint">
            {t.canvas.emptyHint}<strong>{t.promptInput.decompose}</strong>,<br />
            {t.canvas.emptyDecompose}
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {isDecomposing && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <Loader size={28} className="icon-spin" />
            </div>
            <p className="loading-text">{t.promptInput.decomposing}</p>
            <div className="loading-blocks">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="loading-block-pill" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB: navigate to compile */}
      {nodes.length > 0 && (
        <button
          className="canvas-fab"
          onClick={() => setActiveTab('output')}
          title={t.promptOutput.compile}
        >
          <ArrowRight size={22} />
        </button>
      )}
    </div>
  )
}

const FlowCanvas = () => (
  <ReactFlowProvider>
    <CanvasInner />
  </ReactFlowProvider>
)

export default FlowCanvas
