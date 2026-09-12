import { Link, useNavigate } from "react-router-dom";
import { Compass, Home, BookOpen, ArrowLeft } from "lucide-react";
import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col justify-between selection:bg-primary/30 selection:text-foreground">
      <WebNavbar />

      <main className="py-24 px-6 max-w-2xl mx-auto text-center space-y-8 my-auto">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_24px_rgba(255,178,44,0.25)] mx-auto animate-bounce">
          <Compass className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary/80 text-muted-foreground border border-border">
            HTTP 404 • Flight Coordinates Missing
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Flight Route Not Found
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            The destination URL or autonomous route coordinates you requested do not exist or have been re-indexed into a different workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="skeuo-button-secondary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="skeuo-button-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Return to Landing</span>
          </Link>

          <Link
            to="/docs"
            className="skeuo-button-secondary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer text-foreground"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Read Documentation</span>
          </Link>
        </div>
      </main>

      <WebFooter />
    </div>
  );
}
