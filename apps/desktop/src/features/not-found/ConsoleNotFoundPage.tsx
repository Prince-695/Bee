import { useNavigate } from "react-router-dom";
import { Compass, Home, Bot, History, ArrowLeft } from "lucide-react";

export default function ConsoleNotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center space-y-6 bg-background text-foreground font-sans">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,178,44,0.2)]">
        <Compass className="w-8 h-8 animate-spin-slow" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
          404 • Flight Coordinates Not Found
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Lost Flight Route
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The requested console view, route ID, or execution transcript does not exist or has expired from active cache.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="skeuo-button-secondary text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>

        <button
          onClick={() => navigate("/")}
          className="skeuo-button-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Mission Control</span>
        </button>

        <button
          onClick={() => navigate("/chat")}
          className="skeuo-button-secondary text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-foreground"
        >
          <Bot className="w-3.5 h-3.5 text-primary" />
          <span>Launch AI Chat</span>
        </button>

        <button
          onClick={() => navigate("/logs")}
          className="skeuo-button-secondary text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-foreground"
        >
          <History className="w-3.5 h-3.5 text-primary" />
          <span>Inspect Flight Logs</span>
        </button>
      </div>
    </div>
  );
}
