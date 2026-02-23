import { BLOCK_META } from '@/types/blocks'
import type { BlockType } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'
import type { FlomptNode } from '@/types/blocks'

const Sidebar = () => {
  const addNode = useFlowStore((s) => s.addNode)
  const nodes = useFlowStore((s) => s.nodes)

  const ROW_HEIGHT = 180

  const handleAddBlock = (type: BlockType) => {
    const meta = BLOCK_META[type]
    const idx = nodes.length
    const newNode: FlomptNode = {
      id: `${type}-${Date.now()}`,
      type: 'block',
      position: { x: 60, y: 60 + idx * ROW_HEIGHT },
      data: {
        type,
        label: meta.label,
        content: '',
        description: meta.description,
      },
    }
    addNode(newNode)
  }

  return (
    <aside className="sidebar">
      <h3 className="panel-title">Blocs</h3>
      <p className="sidebar-hint">Cliquez pour ajouter au canvas</p>
      <div className="block-list">
        {(Object.keys(BLOCK_META) as BlockType[]).map((type) => {
          const meta = BLOCK_META[type]
          return (
            <button
              key={type}
              className="block-pill"
              style={{ borderColor: `${meta.color}55`, color: meta.color }}
              onClick={() => handleAddBlock(type)}
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
