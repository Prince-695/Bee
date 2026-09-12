import { useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCw,
} from "lucide-react";
import type { LiveFlightStep } from "./InlineFlightPlayer";

interface FlightDagCanvasProps {
  steps: LiveFlightStep[];
  selectedStep: number | null;
  onSelectStep: (stepNumber: number) => void;
}

// Custom Flight Step Node Component
function FlightStepNode({
  data,
}: NodeProps & {
  data: {
    step: LiveFlightStep;
    isSelected: boolean;
    onSelect: (stepNum: number) => void;
  };
}) {
  const { step, isSelected, onSelect } = data;

  return (
    <div
      onClick={() => onSelect(step.step)}
      className={`w-64 rounded-2xl p-3.5 transition-all cursor-pointer select-none skeuo-glass-card ${
        isSelected
          ? "border-primary ring-2 ring-primary/40 shadow-[0_0_24px_rgba(255,178,44,0.3)] scale-[1.02]"
          : step.status === "running"
          ? "border-primary/80 shadow-[0_0_20px_rgba(255,178,44,0.25)]"
          : step.status === "completed"
          ? "border-emerald-500/40"
          : step.status === "self_healing"
          ? "border-purple-500/60 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          : step.status === "error"
          ? "border-destructive/60"
          : "hover:border-border/90"
      }`}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !size-2.5 !border-2 !border-background"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* LED Status Light */}
          <span
            className={`size-2.5 rounded-full shrink-0 ${
              step.status === "running"
                ? "bg-primary honey-led-active"
                : step.status === "completed"
                ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                : step.status === "self_healing"
                ? "bg-purple-500 animate-ping shadow-[0_0_10px_#A855F7]"
                : step.status === "error"
                ? "bg-destructive shadow-[0_0_8px_#EF4444]"
                : "bg-muted-foreground/40"
            }`}
          />
          <span className="font-mono text-xs font-bold text-foreground">
            Step {step.step}
          </span>
        </div>

        {/* Server :: Tool Badge */}
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 truncate max-w-[120px]">
          {step.server}::{step.tool}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-relaxed mb-2.5">
        {step.description || `Execute ${step.tool}`}
      </p>

      {/* Footer Status Pill */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] font-mono">
        <span
          className={`flex items-center gap-1 font-semibold uppercase ${
            step.status === "running"
              ? "text-primary"
              : step.status === "completed"
              ? "text-emerald-500"
              : step.status === "self_healing"
              ? "text-purple-400"
              : step.status === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {step.status === "running" && <Loader2 className="size-3 animate-spin" />}
          {step.status === "completed" && <CheckCircle2 className="size-3" />}
          {step.status === "self_healing" && <RotateCw className="size-3 animate-spin" />}
          {step.status === "error" && <XCircle className="size-3" />}
          <span>{step.status.replace("_", " ")}</span>
        </span>

        {/* Self-Healing Retry Badge */}
        {step.retryCount && step.retryCount > 0 ? (
          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
            Retry #{step.retryCount}
          </span>
        ) : (
          <span className="text-muted-foreground/60">
            deps: {step.depends_on?.length ? step.depends_on.join(", ") : "root"}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !size-2.5 !border-2 !border-background"
      />
    </div>
  );
}

const nodeTypes = {
  flightStep: FlightStepNode,
};

export function FlightDagCanvas({
  steps,
  selectedStep,
  onSelectStep,
}: FlightDagCanvasProps) {
  // Compute Hierarchical DAG layout with Dagre
  const { nodes, edges } = useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: "TB",
      ranksep: 70,
      nodesep: 50,
      marginx: 40,
      marginy: 40,
    });

    const nodeWidth = 260;
    const nodeHeight = 120;

    // Register nodes
    steps.forEach((s) => {
      dagreGraph.setNode(String(s.step), { width: nodeWidth, height: nodeHeight });
    });

    // Register dependency edges
    steps.forEach((s) => {
      if (s.depends_on && s.depends_on.length > 0) {
        s.depends_on.forEach((dep) => {
          dagreGraph.setEdge(String(dep), String(s.step));
        });
      } else if (s.step > 1 && (!s.depends_on || s.depends_on.length === 0)) {
        // Linear fallback if no explicit dependencies
        dagreGraph.setEdge(String(s.step - 1), String(s.step));
      }
    });

    dagre.layout(dagreGraph);

    // Build React Flow Nodes
    const flowNodes: Node[] = steps.map((s) => {
      const nodeWithPos = dagreGraph.node(String(s.step));
      return {
        id: String(s.step),
        type: "flightStep",
        position: {
          x: nodeWithPos ? nodeWithPos.x - nodeWidth / 2 : (s.step - 1) * 280,
          y: nodeWithPos ? nodeWithPos.y - nodeHeight / 2 : 50,
        },
        data: {
          step: s,
          isSelected: selectedStep === s.step,
          onSelect: onSelectStep,
        },
      };
    });

    // Build React Flow Edges
    const flowEdges: Edge[] = [];

    steps.forEach((s) => {
      const deps =
        s.depends_on && s.depends_on.length > 0
          ? s.depends_on
          : s.step > 1
          ? [s.step - 1]
          : [];

      deps.forEach((dep) => {
        const isDepCompleted = steps.find((item) => item.step === dep)?.status === "completed";
        const isCurrentRunning = s.status === "running";

        flowEdges.push({
          id: `e-${dep}-${s.step}`,
          source: String(dep),
          target: String(s.step),
          animated: isCurrentRunning,
          style: {
            stroke: isCurrentRunning
              ? "#FFB22C"
              : isDepCompleted
              ? "#10B981"
              : "rgba(255, 255, 255, 0.2)",
            strokeWidth: isCurrentRunning ? 2.5 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCurrentRunning
              ? "#FFB22C"
              : isDepCompleted
              ? "#10B981"
              : "rgba(255, 255, 255, 0.3)",
          },
        });
      });

      // Self-Healing Visualization Edge
      if (s.retryCount && s.retryCount > 0) {
        flowEdges.push({
          id: `self-heal-${s.step}`,
          source: String(s.step),
          target: String(s.step),
          label: `Self-Heal (${s.retryCount})`,
          animated: true,
          style: {
            stroke: "#A855F7",
            strokeWidth: 2.5,
            strokeDasharray: "4 2",
          },
          labelStyle: {
            fill: "#C084FC",
            fontWeight: 700,
            fontSize: 10,
            fontFamily: "monospace",
          },
          labelBgStyle: {
            fill: "#18191E",
            fillOpacity: 0.9,
            stroke: "#A855F7",
            strokeWidth: 1,
            rx: 6,
            ry: 6,
          },
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [steps, selectedStep, onSelectStep]);

  return (
    <div className="w-full h-full relative skeuo-inset-terminal rounded-2xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(255, 178, 44, 0.15)"
        />
        <Controls className="!bg-card/80 !border-border !rounded-xl !backdrop-blur-md !shadow-xl" />
        <MiniMap
          nodeColor={(n) => {
            const stepData = n.data?.step as LiveFlightStep;
            if (stepData?.status === "running") return "#FFB22C";
            if (stepData?.status === "completed") return "#10B981";
            if (stepData?.status === "self_healing") return "#A855F7";
            if (stepData?.status === "error") return "#EF4444";
            return "#4B5563";
          }}
          className="!bg-card/70 !border-border/80 !rounded-xl !backdrop-blur-md !shadow-2xl overflow-hidden hidden sm:block"
          maskColor="rgba(0, 0, 0, 0.5)"
        />
      </ReactFlow>
    </div>
  );
}
