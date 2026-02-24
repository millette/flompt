import { memo, useState } from 'react'
import { getBezierPath, EdgeLabelRenderer, BaseEdge, useReactFlow } from 'reactflow'
import type { EdgeProps } from 'reactflow'
import { BLOCK_META } from '@/types/blocks'
import type { BlockType } from '@/types/blocks'
import { useFlowStore } from '@/store/flowStore'

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const [hovered, setHovered] = useState(false)
  const { getNode } = useReactFlow()
  const removeEdge = useFlowStore((s) => s.onEdgesChange)

  const sourceNode = getNode(source)
  const targetNode = getNode(target)
  const sourceColor = BLOCK_META[(sourceNode?.data as { type: BlockType })?.type]?.color ?? '#7c3aed'
  const targetColor = BLOCK_META[(targetNode?.data as { type: BlockType })?.type]?.color ?? '#4f46e5'

  const gradientId = `edge-gradient-${id}`

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeEdge([{ id, type: 'remove' }])
  }

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={targetColor} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Glow layer */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: sourceColor,
          strokeWidth: hovered ? 6 : 4,
          strokeOpacity: 0.18,
          filter: `drop-shadow(0 0 4px ${sourceColor})`,
          transition: 'stroke-width 0.15s ease',
        }}
      />

      {/* Main edge */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: hovered ? 2.5 : 1.8,
          strokeDasharray: hovered ? '0' : '6 3',
          strokeDashoffset: 0,
          transition: 'stroke-width 0.15s ease',
          animation: 'edge-flow 1.5s linear infinite',
        }}
        interactionWidth={20}
        markerEnd="none"
      />

      {/* Invisible wider hit zone */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      {/* Delete button on hover */}
      {hovered && (
        <EdgeLabelRenderer>
          <div
            style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
            className="edge-delete-btn nodrag nopan"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <button onClick={handleDelete} title="Supprimer la connexion">✕</button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(CustomEdge)
