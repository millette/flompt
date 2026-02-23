import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { BLOCK_META } from '@/types/blocks'
import type { BlockData } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'

const BlockNode = ({ id, data, selected }: NodeProps<BlockData>) => {
  const meta = BLOCK_META[data.type]
  const updateNodeContent = useFlowStore((s) => s.updateNodeContent)
  const removeNode = useFlowStore((s) => s.removeNode)

  return (
    <div
      style={{ borderColor: meta.color }}
      className={`block-node ${selected ? 'selected' : ''}`}
    >
      <Handle type="target" position={Position.Top} />

      {/* Header */}
      <div className="block-header" style={{ backgroundColor: meta.color }}>
        <span className="block-label">{meta.label}</span>
        <button className="block-remove" onClick={() => removeNode(id)} title="Supprimer">
          ×
        </button>
      </div>

      {/* Content */}
      <textarea
        className="block-content"
        value={data.content}
        placeholder={meta.description}
        onChange={(e) => updateNodeContent(id, e.target.value)}
        rows={3}
      />

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(BlockNode)
