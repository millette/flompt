import type { FlomptNode, FlomptEdge, CompiledPrompt } from '@/types/blocks'

/**
 * Tri topologique (Kahn) selon les edges.
 * Fallback : tri par position.y (haut → bas) si pas d'edges.
 */
function sortNodes(nodes: FlomptNode[], edges: FlomptEdge[]): FlomptNode[] {
  if (edges.length === 0) {
    return [...nodes].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
  }

  const inDegree = new Map(nodes.map(n => [n.id, 0]))
  const adjList  = new Map(nodes.map(n => [n.id, [] as string[]]))

  for (const edge of edges) {
    adjList.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const queue   = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0)
  const result: FlomptNode[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)
    for (const neighborId of (adjList.get(node.id) ?? [])) {
      const deg = (inDegree.get(neighborId) ?? 1) - 1
      inDegree.set(neighborId, deg)
      if (deg === 0) {
        const neighbor = nodeMap.get(neighborId)
        if (neighbor) queue.push(neighbor)
      }
    }
  }

  // Nœuds restants (cycles éventuels) triés par position.y
  const inResult  = new Set(result.map(n => n.id))
  const remaining = nodes
    .filter(n => !inResult.has(n.id))
    .sort((a, b) => a.position.y - b.position.y)

  return [...result, ...remaining]
}

/**
 * Assemble les blocs en prompt final — 100% local, zéro appel IA.
 * Format : [Label]\nContenu\n\n[Label]\nContenu…
 */
export function assemblePrompt(nodes: FlomptNode[], edges: FlomptEdge[]): CompiledPrompt {
  const ordered = sortNodes(nodes, edges)

  const parts = ordered
    .filter(n => n.data.content.trim())
    .map(n => `[${n.data.label}]\n${n.data.content.trim()}`)

  const raw           = parts.join('\n\n')
  const tokenEstimate = Math.max(1, Math.ceil(raw.length / 4))

  return { raw, tokenEstimate, blocks: ordered.map(n => n.data) }
}
