const defaultApiBaseUrl = `http://${window.location.hostname || "localhost"}:8000`;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(
  /\/$/,
  ""
);

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
}

export interface RouteStep {
  step: number;
  description: string;
  server: string;
  server_icon: string;
  tool: string;
  args: Record<string, unknown>;
  depends_on: number[];
}

export interface AgentRoute {
  route_id: string;
  prompt: string;
  route_summary: string;
  steps: RouteStep[];
  step_count: number;
  failed_servers: string[];
  status: string;
}

export interface FlightStep {
  step: number;
  server: string;
  server_icon: string;
  tool: string;
  args: Record<string, unknown>;
  result: string;
}

export interface FlightResult {
  route_id: string;
  assistant_response: string;
  steps: FlightStep[];
  tool_step_count: number;
}

export interface AgentRunResult {
  queued: boolean;
  task_id?: string;
  webhook_type?: string;
  assistant_response: string;
  steps: FlightStep[];
  tool_step_count: number;
  failed_servers: string[];
  route_id?: string;
}

export interface ChatListItem {
  id: string;
  prompt: string;
  route_id: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface ChatRecord extends ChatListItem {
  route_json: Record<string, unknown> | null;
  result_json: Record<string, unknown> | null;
}

export interface WaitingTask {
  id: string;
  prompt: string;
  status: string;
  webhook_type: string;
  webhook_filter: Record<string, unknown>;
  created_at: string;
}

export type HookStatus = "waiting" | "resumed" | "done" | "failed";

export interface HookTask {
  id: string;
  prompt: string;
  status: HookStatus;
  webhook_type: string;
  webhook_filter: Record<string, unknown>;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export interface HooksSummary {
  active: HookTask[];
  inactive: HookTask[];
  summary: {
    total: number;
    active_count: number;
    inactive_count: number;
    breakdown: Record<HookStatus, number>;
  };
}

export interface SSEStepStart {
  type: "step_start";
  step: number;
  server: string;
  server_icon: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface SSEStepComplete {
  type: "step_complete";
  step: number;
  result: string;
}

export interface SSEStepError {
  type: "step_error";
  step: number;
  error: string;
}

export interface SSELLMToken {
  type: "llm_token";
  token: string;
}

export interface SSEFlightComplete {
  type: "flight_complete";
  summary: string;
}

export interface SSEFlightError {
  type: "flight_error";
  error: string;
}

export interface SSESelfHealRetry {
  type: "self_heal_retry";
  step: number;
  retry_count: number;
  error: string;
}

export interface SSEGatePending {
  type: "gate_pending";
  gate_id: string;
  step: number;
  server: string;
  tool: string;
  action_summary: string;
}

export interface SSEGateResolved {
  type: "gate_resolved";
  gate_id: string;
  status: string;
}

export type SSEEvent =
  | SSEStepStart
  | SSEStepComplete
  | SSEStepError
  | SSESelfHealRetry
  | SSEGatePending
  | SSEGateResolved
  | SSELLMToken
  | SSEFlightComplete
  | SSEFlightError
  | { type: "execution_complete"; summary: string }
  | { type: "execution_error"; error: string };

export interface AgentRuntimeStatus {
  runtime_initialized: boolean;
  tool_count: number;
  failed_servers: string[];
  configured_servers?: string[];
  waiting_task_count: number;
  pending_routes: number;
  waiting_tasks: Array<{ id: string; type: string; status: string }>;
}

export interface HiveRegistryServer {
  name: string;
  status: "ready" | "failed" | "pending" | string;
}

export interface HiveRegistryStatus {
  servers: HiveRegistryServer[];
  tool_count: number;
  runtime_initialized: boolean;
  failed_servers: string[];
}

export interface HealthStatus {
  status: string;
  uptime_seconds: number;
  runtime_initialized: boolean;
  tool_count: number;
  failed_servers: string[];
}

export interface LogQueryEntry {
  id: string;
  trace_id: string | null;
  timestamp: string;
  level: string;
  subsystem: string;
  action: string;
  data: Record<string, unknown> | null;
  duration_ms: number | null;
  execution_id: string | null;
}

export interface LogStreamPayload {
  type: string;
  entry?: {
    id?: string;
    trace_id?: string | null;
    timestamp?: string;
    level?: string;
    subsystem?: string;
    action?: string;
    source?: string;
    event?: string;
    message?: string;
    data?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    execution_id?: string | null;
  };
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

let authToken: string | null =
  typeof localStorage !== "undefined" ? localStorage.getItem("bee_auth_token") : null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem("bee_auth_token", token);
  else localStorage.removeItem("bee_auth_token");
}

export function getAuthToken(): string | null {
  return authToken;
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined>
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  query?: Record<string, string | number | undefined>
): Promise<T> {
  const shouldSetJsonContentType =
    options.body !== undefined && !(options.body instanceof FormData);

  const headers: Record<string, string> = {
    ...(shouldSetJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(buildUrl(path, query), {
    ...options,
    headers,
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success || payload.data === undefined) {
    const errorMessage =
      payload.error?.message || `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }
  return payload.data;
}

export async function signup(
  email: string,
  password: string,
  name = ""
): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  setAuthToken(session.token);
  return session;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(session.token);
  return session;
}

export async function getMe(): Promise<AuthUser> {
  return await apiRequest<AuthUser>("/api/auth/me", { method: "GET" });
}

export function logout() {
  setAuthToken(null);
}

export async function createRoute(prompt: string): Promise<AgentRoute> {
  return await apiRequest<AgentRoute>("/api/agent/route", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export async function executeFlight(routeId: string): Promise<FlightResult> {
  return await apiRequest<FlightResult>(`/api/agent/flight/${routeId}`, {
    method: "POST",
  });
}

export async function getRoute(routeId: string): Promise<AgentRoute> {
  return await apiRequest<AgentRoute>(`/api/agent/route/${routeId}`, {
    method: "GET",
  });
}

export function createFlightStream(routeId: string): EventSource {
  const url = buildUrl(`/api/agent/flight/${routeId}/stream`);
  // EventSource cannot set Authorization; token query fallback for SSE
  const withToken = authToken
    ? `${url}${url.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(authToken)}`
    : url;
  return new EventSource(withToken);
}

export async function runAgent(prompt: string): Promise<AgentRunResult> {
  return await apiRequest<AgentRunResult>("/api/agent/run", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export async function getChats(limit = 50): Promise<ChatListItem[]> {
  return await apiRequest<ChatListItem[]>("/api/chats", { method: "GET" }, { limit });
}

export async function getChat(chatId: string): Promise<ChatRecord> {
  return await apiRequest<ChatRecord>(`/api/chats/${chatId}`, { method: "GET" });
}

export async function getWaitingTasks(): Promise<WaitingTask[]> {
  return await apiRequest<WaitingTask[]>("/api/chats/waiting", { method: "GET" });
}

export async function getHooksSummary(): Promise<HooksSummary> {
  return await apiRequest<HooksSummary>("/api/chats/hooks", { method: "GET" });
}

export async function getAgentRuntimeStatus(): Promise<AgentRuntimeStatus> {
  return await apiRequest<AgentRuntimeStatus>("/api/agent/runtime", { method: "GET" });
}

export async function getHiveRegistry(): Promise<HiveRegistryStatus> {
  return await apiRequest<HiveRegistryStatus>("/api/hive/registry", { method: "GET" });
}

export async function getHealthStatus(): Promise<HealthStatus> {
  return await apiRequest<HealthStatus>("/api/health", { method: "GET" });
}

export interface ApprovalGateRecord {
  gate_id: string;
  route_id: string;
  step_num: number;
  server: string;
  tool: string;
  args: Record<string, unknown>;
  action_summary: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at: string | null;
}

export async function listApprovalGates(routeId?: string, status?: string): Promise<ApprovalGateRecord[]> {
  return await apiRequest<ApprovalGateRecord[]>("/api/agent/gates", { method: "GET" }, { route_id: routeId, status });
}

export async function approveGate(gateId: string): Promise<ApprovalGateRecord> {
  return await apiRequest<ApprovalGateRecord>(`/api/agent/gates/${gateId}/approve`, { method: "POST" });
}

export async function rejectGate(gateId: string): Promise<ApprovalGateRecord> {
  return await apiRequest<ApprovalGateRecord>(`/api/agent/gates/${gateId}/reject`, { method: "POST" });
}

export async function queryLogs(params?: {
  level?: string;
  subsystem?: string;
  fromTime?: string;
  limit?: number;
}): Promise<LogQueryEntry[]> {
  const payload = await apiRequest<{ entries: LogQueryEntry[] }>(
    "/api/logs/query",
    { method: "GET" },
    {
      level: params?.level,
      subsystem: params?.subsystem,
      from_time: params?.fromTime,
      limit: params?.limit,
    }
  );
  return payload.entries;
}

export function createLogEventSource(executionId?: string): EventSource {
  return new EventSource(buildUrl("/api/logs/stream", { execution_id: executionId }));
}

// Legacy aliases
/** @deprecated Use createRoute */
export const planAgent = createRoute;
/** @deprecated Use executeFlight */
export const executePlan = executeFlight;
/** @deprecated Use getRoute */
export const getPlan = getRoute;
/** @deprecated Use createFlightStream */
export const createExecutionStream = createFlightStream;
export type AgentPlan = AgentRoute;
export type ExecutionResult = FlightResult;
export type PlanStep = RouteStep;
export type ExecutionStep = FlightStep;
