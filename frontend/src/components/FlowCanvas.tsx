import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '@/store/flowStore'
import BlockNode from './BlockNode'
import { BLOCK_META } from '@/types/blocks'
import type { BlockType } from '@/types/blocks'

const nodeTypes = { block: BlockNode }

const FlowCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, isDecomposing } = useFlowStore()

  return (
    <div className="flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        snapToGrid
        snapGrid={[20, 20]}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e1e3a" />
        <Controls />
        <MiniMap
          nodeColor={(n) => BLOCK_META[(n.data as { type: BlockType }).type]?.color ?? '#7c3aed'}
          style={{ background: 'rgba(7, 7, 26, 0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}
        />
      </ReactFlow>

      {/* Skeleton loading overlay */}
      {isDecomposing && (
        <div className="skeleton-overlay">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton-block"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FlowCanvas
