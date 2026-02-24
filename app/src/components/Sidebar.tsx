import { BLOCK_META } from '@/types/blocks'
import type { BlockType } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'
import type { FlomptNode } from '@/types/blocks'
import { useLocale } from '@/i18n/LocaleContext'

const Sidebar = () => {
  const addNode = useFlowStore((s) => s.addNode)
  const nodes = useFlowStore((s) => s.nodes)
  const { t } = useLocale()
  const ROW_HEIGHT = 180

  const createNode = (type: BlockType, position?: { x: number; y: number }): FlomptNode => {
    const tr = t.blocks[type]
    const idx = nodes.length
    return {
      id: `${type}-${Date.now()}`,
      type: 'block',
      position: position ?? { x: 60, y: 60 + idx * ROW_HEIGHT },
      data: { type, label: tr.label, content: '', description: tr.description },
    }
  }

  const handleAddBlock = (type: BlockType) => addNode(createNode(type))

  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="sidebar">
      <h3 className="panel-title">{t.sidebar.title}</h3>
      <p className="sidebar-hint">{t.sidebar.hint}</p>
      <div className="block-list">
        {(Object.keys(BLOCK_META) as BlockType[]).map((type) => {
          const meta = BLOCK_META[type]
          const tr = t.blocks[type]
          const Icon = meta.icon
          return (
            <button
              key={type}
              className="block-pill"
              style={{ borderColor: `${meta.color}55`, color: meta.color }}
              onClick={() => handleAddBlock(type)}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              title={tr.description}
            >
              <span className="block-pill-icon">
                <Icon size={13} />
              </span>
              {tr.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
