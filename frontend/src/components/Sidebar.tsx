import { BLOCK_META } from '@/types/blocks'
import type { BlockType } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'
import type { FlomptNode } from '@/types/blocks'

const Sidebar = () => {
  const addNode = useFlowStore((s) => s.addNode)
  const nodes = useFlowStore((s) => s.nodes)
  const ROW_HEIGHT = 180

  const createNode = (type: BlockType, position?: { x: number; y: number }): FlomptNode => {
    const meta = BLOCK_META[type]
    const idx = nodes.length
    return {
      id: `${type}-${Date.now()}`,
      type: 'block',
      position: position ?? { x: 60, y: 60 + idx * ROW_HEIGHT },
      data: { type, label: meta.label, content: '', description: meta.description },
    }
  }

  const handleAddBlock = (type: BlockType) => addNode(createNode(type))

  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="sidebar">
      <h3 className="panel-title">Blocs</h3>
      <p className="sidebar-hint">Clic pour ajouter · Glisser vers le canvas</p>
      <div className="block-list">
        {(Object.keys(BLOCK_META) as BlockType[]).map((type) => {
          const meta = BLOCK_META[type]
          return (
            <button
              key={type}
              className="block-pill"
              style={{ borderColor: `${meta.color}55`, color: meta.color }}
              onClick={() => handleAddBlock(type)}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              title={meta.description}
            >
              <span className="block-pill-icon">{meta.icon}</span>
              {meta.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
