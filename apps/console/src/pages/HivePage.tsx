import { useCallback, useEffect, useState } from "react";
import { Hexagon, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHiveRegistry, type HiveRegistryStatus } from "@/lib/api";

function statusIcon(status: string) {
  if (status === "ready") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (status === "failed") return <AlertTriangle className="w-4 h-4 text-destructive" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

export default function HivePage() {
  const [data, setData] = useState<HiveRegistryStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getHiveRegistry());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Hive Registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  return (
    <div className="flex h-full flex-col overflow-auto p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">Hive Registry</h1>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Connected Hive workers Bee can use on a Flight. Status reflects the
            current API runtime load.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-2"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive border-2 border-destructive/40 px-3 py-2">
          {error}
        </p>
      )}

      <div className="mb-6 grid grid-cols-3 gap-4 max-w-2xl">
        <div className="border-2 border-border p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            Tools
          </p>
          <p className="text-2xl font-black">{data?.tool_count ?? "—"}</p>
        </div>
        <div className="border-2 border-border p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            Servers
          </p>
          <p className="text-2xl font-black">{data?.servers.length ?? "—"}</p>
        </div>
        <div className="border-2 border-border p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            Runtime
          </p>
          <p className="text-2xl font-black">
            {data ? (data.runtime_initialized ? "Ready" : "Pending") : "—"}
          </p>
        </div>
      </div>

      <div className="border-2 border-border divide-y-2 divide-border max-w-3xl">
        {(data?.servers ?? []).map((server) => (
          <div
            key={server.name}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {statusIcon(server.status)}
              <span className="font-semibold capitalize">{server.name}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {server.status}
            </span>
          </div>
        ))}
        {!loading && (data?.servers.length ?? 0) === 0 && (
          <div className="px-4 py-8 text-muted-foreground text-sm">
            No Hive servers configured.
          </div>
        )}
      </div>

      {(data?.failed_servers.length ?? 0) > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Failed: {data?.failed_servers.join(", ")}
        </p>
      )}
    </div>
  );
}
