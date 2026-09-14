export interface DAGNodeData {
  id: string
  label: string
  title: string
  assigned_role: string
  assigned_worker_id: string
  instruction: string
  dependencies: string[]
  status: 'pending' | 'running' | 'waiting_gate' | 'completed' | 'failed' | 'blocked'
  gate_required?: boolean
  gate_id?: string | null
  gate_risk_level?: string | null
  stdout_log?: string
  duration_seconds?: number
  output_artifacts?: string[]
}

export interface MissionData {
  id: string
  title: string
  objective: string
  crew_template_id: string
  crew_name: string
  status: 'created' | 'running' | 'paused' | 'completed' | 'failed'
  created_at: string
  nodes: DAGNodeData[]
  topological_tiers: string[][]
}
