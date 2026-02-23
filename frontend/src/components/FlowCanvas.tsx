import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '@/store/flowStore'
import BlockNode from './BlockNode'

const nodeTypes = { block: BlockNode }

const FlowCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useFlowStore()

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
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as { type: string }
            return '#6366f1'
          }}
          style={{ background: '#1a1a2e' }}
        />
      </ReactFlow>
    </div>
  )
}

export default FlowCanvas
