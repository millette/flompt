import { BLOCK_META } from '@/types/blocks'
import type { BlockType } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'
import type { FlomptNode } from '@/types/blocks'

const Sidebar = () => {
  const addNode = useFlowStore((s) => s.addNode)
  const nodes = useFlowStore((s) => s.nodes)

  const handleAddBlock = (type: BlockType) => {
    const meta = BLOCK_META[type]
    const newNode: FlomptNode = {
      id: `${type}-${Date.now()}`,
      type: 'block',
      position: { x: 100 + Math.random() * 200, y: 100 + nodes.length * 80 },
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
      <h3 className="sidebar-title">Blocs</h3>
      <p className="sidebar-hint">Cliquez pour ajouter</p>
      <div className="block-list">
        {(Object.keys(BLOCK_META) as BlockType[]).map((type) => {
          const meta = BLOCK_META[type]
          return (
            <button
              key={type}
              className="block-pill"
              style={{ borderColor: meta.color, color: meta.color }}
              onClick={() => handleAddBlock(type)}
              title={meta.description}
            >
              {meta.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
