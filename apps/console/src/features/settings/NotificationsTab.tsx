import React, { useState } from "react";
import {
  Bell,
  Smartphone,
  MessageSquare,
  CheckCircle2,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const NotificationsTab: React.FC = () => {
  const [whatsAppPhone, setWhatsAppPhone] = useState("+1 (555) 019-2834");
  const [slackWebhook, setSlackWebhook] = useState(
    "https://hooks.slack.com/services/T019283/B029384/88af0b91ca82e44"
  );
  const [slackChannel, setSlackChannel] = useState("#bee-deployments");
  const [isWhatsAppTesting, setIsWhatsAppTesting] = useState(false);
  const [isSlackTesting, setIsSlackTesting] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);
  const [slackSuccess, setSlackSuccess] = useState(false);

  const testWhatsApp = () => {
    setIsWhatsAppTesting(true);
    setTimeout(() => {
      setIsWhatsAppTesting(false);
      setWhatsAppSuccess(true);
      setTimeout(() => setWhatsAppSuccess(false), 3000);
    }, 800);
  };

  const testSlack = () => {
    setIsSlackTesting(true);
    setTimeout(() => {
      setIsSlackTesting(false);
      setSlackSuccess(true);
      setTimeout(() => setSlackSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="skeuo-glass-card rounded-2xl p-5 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,178,44,0.2)]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Remote Approval & Notification Channels
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
                MULTI-CHANNEL READY
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive 1-tap zero-trust approval requests directly on WhatsApp and Slack.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert("Notification routes updated.")}
          className="skeuo-button-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Save Channels</span>
        </button>
      </div>

      {/* Channel 1: WhatsApp Meta Cloud API */}
      <div className="skeuo-glass-card rounded-2xl p-5 space-y-4 border border-border/60">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                WhatsApp Meta Cloud API (1-Tap Gate Approvals)
              </h4>
              <p className="text-xs text-muted-foreground">
                Dispatches interactive WhatsApp buttons for instant mobile git commit clearance.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" /> ACTIVE
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Lead Engineer WhatsApp Phone
            </label>
            <input
              type="text"
              value={whatsAppPhone}
              onChange={(e) => setWhatsAppPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/70 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Verification Status
            </label>
            <div className="p-2 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Webhook 200 OK
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">Meta Graph v19.0</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            Sends interactive buttons: [Approve & Commit ✓] or [Reject ✕]
          </span>
          <button
            onClick={testWhatsApp}
            disabled={isWhatsAppTesting}
            className="skeuo-button-secondary text-xs px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {isWhatsAppTesting
                ? "Sending Ping..."
                : whatsAppSuccess
                ? "Sent to Phone!"
                : "Test WhatsApp Ping"}
            </span>
          </button>
        </div>
      </div>

      {/* Channel 2: Slack Incoming Webhooks */}
      <div className="skeuo-glass-card rounded-2xl p-5 space-y-4 border border-border/60">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Slack Incoming Webhook
              </h4>
              <p className="text-xs text-muted-foreground">
                Broadcasts autonomous mission updates and spend limit warnings to your workspace channel.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border-amber-500/30 font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" /> CONNECTED
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Slack Incoming Webhook URL
            </label>
            <input
              type="text"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/70 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Target Channel
            </label>
            <input
              type="text"
              value={slackChannel}
              onChange={(e) => setSlackChannel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/70 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            Triggers on: Critical Gate • Test Failure • Daily Spend Digest
          </span>
          <button
            onClick={testSlack}
            disabled={isSlackTesting}
            className="skeuo-button-secondary text-xs px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {isSlackTesting
                ? "Broadcasting..."
                : slackSuccess
                ? "Posted to #bee-deployments!"
                : "Test Slack Message"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
