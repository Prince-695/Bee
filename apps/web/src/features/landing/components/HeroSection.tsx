import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Play, Copy, Check } from "lucide-react";
import {
  detectUserOS,
  triggerDirectDownload,
  DOWNLOAD_OPTIONS,
  type DownloadOption,
  type SupportedOS,
} from "@/lib/downloads";

export function HeroSection() {
  const navigate = useNavigate();
  const [detectedOS] = useState<DownloadOption>(() => detectUserOS());
  const [copiedCli, setCopiedCli] = useState(false);

  const handlePrimaryDownload = () => {
    triggerDirectDownload(detectedOS);
  };

  const handleDownloadSpecific = (osKey: SupportedOS) => {
    triggerDirectDownload(DOWNLOAD_OPTIONS[osKey]);
  };

  const copyInstallCmd = () => {
    navigator.clipboard.writeText("curl -fsSL https://get.bee.dev | bash");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <section className="relative pt-20 pb-16 px-6 z-10">
      <div className="max-w-5xl mx-auto text-center space-y-6">
        {/* Release Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Bee 0.1.0 Cross-Platform Desktop & Cloud Available</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
          The Autonomous AI Co-Engineer for{" "}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            Production Codebases.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Bee coordinates 5 specialized AI workers across your repository, fixes broken tests in sandboxes,
          redacts secrets automatically, and verifies human approvals on WhatsApp & Slack.
        </p>

        {/* Download & Launch Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center gap-2"
            onClick={handlePrimaryDownload}
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Direct Download for {detectedOS.osName} ({detectedOS.fileExt})
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-12 px-6 rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold flex items-center gap-2"
            onClick={() => navigate("/login")}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Open Cloud Workspace
          </Button>
        </div>

        {/* Quick CLI copy & OS selector */}
        <div className="pt-2 flex flex-col items-center justify-center gap-3">
          <div
            onClick={copyInstallCmd}
            className="px-4 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 transition-colors inline-flex items-center gap-2 font-mono text-xs text-zinc-400 cursor-pointer"
          >
            <span className="text-amber-400">$</span>
            <span>curl -fsSL https://get.bee.dev | bash</span>
            {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
            <span>Also available for:</span>
            {Object.values(DOWNLOAD_OPTIONS).map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleDownloadSpecific(opt.id)}
                className="px-2.5 py-0.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/40 hover:text-amber-400 transition-all font-mono text-[11px] text-zinc-400 cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-zinc-500" />
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
