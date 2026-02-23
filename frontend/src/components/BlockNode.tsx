import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { BLOCK_META } from '@/types/blocks'
import type { BlockData } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'

const BlockNode = ({ id, data, selected }: NodeProps<BlockData>) => {
  const meta = BLOCK_META[data.type]
  const updateNodeContent = useFlowStore((s) => s.updateNodeContent)
  const removeNode = useFlowStore((s) => s.removeNode)
  const [collapsed, setCollapsed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el || collapsed) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [data.content, collapsed])

  return (
    <div
      style={{ borderColor: meta.color }}
      className={`block-node ${selected ? 'selected' : ''}`}
    >
      <Handle type="target" position={Position.Top} />

      {/* Header */}
      <div className="block-header" style={{ backgroundColor: meta.color }}>
        <div className="block-header-left">
          <span className="block-icon">{meta.icon}</span>
          <span className="block-label">{meta.label}</span>
        </div>
        <div className="block-actions">
          <button
            className="block-collapse"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Développer' : 'Réduire'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <button className="block-remove" onClick={() => removeNode(id)} title="Supprimer">
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="block-body">
          <textarea
            ref={textareaRef}
            className="block-content"
            value={data.content}
            placeholder={meta.description}
            onChange={(e) => updateNodeContent(id, e.target.value)}
            style={{ minHeight: '64px', height: 'auto' }}
          />
          <div className="block-footer">
            <span className="block-char-count">{data.content.length} car.</span>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(BlockNode)
