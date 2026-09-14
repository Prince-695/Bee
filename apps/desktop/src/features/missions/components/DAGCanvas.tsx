import type { FC, MouseEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { DAGNodeData } from '../types'
import { NodeCard } from './NodeCard'

interface DAGCanvasProps {
  nodes: DAGNodeData[]
  topologicalTiers: string[][]
  selectedNodeId: string | null
  onSelectNode: (id: string) => void
}

interface Point {
  x: number
  y: number
}

const CARD_WIDTH = 256
const CARD_HEIGHT = 130
const TIER_SPACING_X = 360
const NODE_SPACING_Y = 170

export const DAGCanvas: FC<DAGCanvasProps> = ({
  nodes,
  topologicalTiers,
  selectedNodeId,
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState<Point>({ x: 40, y: 40 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 })

  // Compute (x, y) coordinates for each node
  const nodePositions = useMemo(() => {
    const posMap: Record<string, Point> = {}
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    // If tiers are empty or single, compute simple topological tiers
    const tiers = topologicalTiers.length > 0 ? topologicalTiers : [nodes.map((n) => n.id)]

    tiers.forEach((tier, tierIdx) => {
      const tierHeight = tier.length * NODE_SPACING_Y
      const startY = Math.max(40, 200 - tierHeight / 2)

      tier.forEach((nodeId, nodeIdx) => {
        if (nodeMap.has(nodeId)) {
          posMap[nodeId] = {
            x: 60 + tierIdx * TIER_SPACING_X,
            y: startY + nodeIdx * NODE_SPACING_Y,
          }
        }
      })
    })

    // Catch any node not in tiers
    nodes.forEach((n, idx) => {
      if (!posMap[n.id]) {
        posMap[n.id] = { x: 60 + idx * TIER_SPACING_X, y: 80 }
      }
    })

    return posMap
  }, [nodes, topologicalTiers])

  // Compute SVG bezier curve connector paths
  const connectorPaths = useMemo(() => {
    const paths: Array<{
      id: string
      d: string
      status: 'completed' | 'active' | 'gate' | 'pending'
    }> = []

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    nodes.forEach((targetNode) => {
      const targetPos = nodePositions[targetNode.id]
      if (!targetPos) return

      targetNode.dependencies.forEach((depId) => {
        const sourcePos = nodePositions[depId]
        const sourceNode = nodeMap.get(depId)
        if (!sourcePos || !sourceNode) return

        const startX = sourcePos.x + CARD_WIDTH
        const startY = sourcePos.y + CARD_HEIGHT / 2
        const endX = targetPos.x
        const endY = targetPos.y + CARD_HEIGHT / 2

        const deltaX = Math.abs(endX - startX) * 0.5
        const cp1x = startX + deltaX
        const cp1y = startY
        const cp2x = endX - deltaX
        const cp2y = endY

        const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`

        let status: 'completed' | 'active' | 'gate' | 'pending' = 'pending'
        if (targetNode.status === 'waiting_gate') {
          status = 'gate'
        } else if (targetNode.status === 'running' || sourceNode.status === 'running') {
          status = 'active'
        } else if (sourceNode.status === 'completed' && targetNode.status === 'completed') {
          status = 'completed'
        }

        paths.push({
          id: `${depId}->${targetNode.id}`,
          d,
          status,
        })
      })
    })

    return paths
  }, [nodes, nodePositions])

  // Drag & Pan handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return // Only primary click
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))
  const handleReset = () => {
    setZoom(1.0)
    setPan({ x: 40, y: 40 })
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative h-full w-full overflow-hidden bg-[#07090e] cursor-grab active:cursor-grabbing select-none"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Zoom / Pan Floating Toolbar */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0e121a]/90 p-1.5 backdrop-blur-xl shadow-2xl">
        <button
          onClick={handleZoomIn}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-white/10" />
        <span className="px-2 font-mono text-[11px] text-slate-400">
          {Math.round(zoom * 100)}%
        </span>
        <div className="h-4 w-px bg-white/10" />
        <button
          onClick={handleReset}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          title="Reset Pan & Zoom"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas World Container */}
      <div
        className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Connectors Layer */}
        <svg
          className="pointer-events-none absolute inset-0 h-[4000px] w-[6000px] overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="gradient-completed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {connectorPaths.map((path) => {
            let strokeColor = 'rgba(255, 255, 255, 0.15)'
            let strokeWidth = 2
            let strokeDash = undefined

            if (path.status === 'active') {
              strokeColor = 'url(#gradient-active)'
              strokeWidth = 3
              strokeDash = '6 4'
            } else if (path.status === 'gate') {
              strokeColor = '#f43f5e'
              strokeWidth = 3
              strokeDash = '4 4'
            } else if (path.status === 'completed') {
              strokeColor = 'url(#gradient-completed)'
              strokeWidth = 2.5
            }

            return (
              <g key={path.id}>
                {/* Glow shadow for active/gate edges */}
                {(path.status === 'active' || path.status === 'gate') && (
                  <path
                    d={path.d}
                    fill="none"
                    stroke={path.status === 'gate' ? '#f43f5e' : '#f59e0b'}
                    strokeWidth={8}
                    strokeOpacity={0.2}
                  />
                )}
                <path
                  d={path.d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  className={path.status === 'active' ? 'animate-[dash_1.5s_linear_infinite]' : ''}
                />
              </g>
            )
          })}
        </svg>

        {/* Nodes Layer */}
        <div className="relative">
          {nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 0, y: 0 }
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                }}
              >
                <NodeCard
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => onSelectNode(node.id)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
