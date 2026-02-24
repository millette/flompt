import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Copy, ChevronDown, ChevronRight, X } from 'lucide-react'
import { BLOCK_META } from '@/types/blocks'
import type { BlockData } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'

const BlockNode = ({ id, data, selected }: NodeProps<BlockData>) => {
  const meta = BLOCK_META[data.type]
  const Icon = meta.icon
  const updateNodeContent = useFlowStore((s) => s.updateNodeContent)
  const removeNode = useFlowStore((s) => s.removeNode)
  const addNode = useFlowStore((s) => s.addNode)
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const nodes = useFlowStore((s) => s.nodes)
  const [collapsed, setCollapsed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el || collapsed) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [data.content, collapsed])

  const handleDuplicate = () => {
    const currentNode = nodes.find((n) => n.id === id)
    if (!currentNode) return
    onNodesChange([{ id, type: 'select', selected: false }])
    addNode({
      ...currentNode,
      id: `${data.type}-${Date.now()}`,
      position: { x: currentNode.position.x + 40, y: currentNode.position.y + 40 },
      data: { ...data },
    })
  }

  return (
    <div
      style={{ '--block-color': meta.color } as React.CSSProperties}
      className={`block-node ${selected ? 'selected' : ''}`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="block-header">
        <div className="block-header-left">
          <span className="block-icon">
            <Icon size={13} />
          </span>
          <span className="block-label">{meta.label}</span>
        </div>
        <div className="block-actions">
          <button className="block-collapse" onClick={handleDuplicate} title="Dupliquer">
            <Copy size={11} />
          </button>
          <button
            className="block-collapse"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Développer' : 'Réduire'}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
          <button className="block-remove" onClick={() => removeNode(id)} title="Supprimer">
            <X size={11} />
          </button>
        </div>
      </div>

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
