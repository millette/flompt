import { BLOCK_META } from '@/types/blocks'
import type { BlockType } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'
import type { FlomptNode } from '@/types/blocks'

const Sidebar = () => {
  const addNode = useFlowStore((s) => s.addNode)
  const nodes = useFlowStore((s) => s.nodes)

  const COLS = 3
  const COL_WIDTH = 280
  const ROW_HEIGHT = 160

  const handleAddBlock = (type: BlockType) => {
    const meta = BLOCK_META[type]
    const idx = nodes.length
    const col = idx % COLS
    const row = Math.floor(idx / COLS)
    const newNode: FlomptNode = {
      id: `${type}-${Date.now()}`,
      type: 'block',
      position: { x: 60 + col * COL_WIDTH, y: 60 + row * ROW_HEIGHT },
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
