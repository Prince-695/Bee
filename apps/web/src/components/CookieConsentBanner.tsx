import { useState, useEffect } from "react";
import { Shield, Check, X, Sliders } from "lucide-react";
import { Link } from "react-router-dom";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: true,
    telemetry: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("bee_cookie_consent");
    if (!saved) {
      // Delay display slightly for smoother entrance
      const t = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("bee_cookie_consent", JSON.stringify({ essential: true, functional: true, telemetry: true }));
    setIsVisible(false);
  };

  const handleNecessaryOnly = () => {
    localStorage.setItem("bee_cookie_consent", JSON.stringify({ essential: true, functional: false, telemetry: false }));
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem("bee_cookie_consent", JSON.stringify(preferences));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Cookie & Privacy Preferences</span>
          </div>
          <button
            onClick={handleNecessaryOnly}
            className="text-muted-foreground hover:text-foreground"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Bee uses strictly functional session tokens and anonymous performance telemetry to power autonomous agent swarms. Read our{" "}
          <Link to="/privacy" className="text-primary hover:underline font-medium">
            Privacy Policy
          </Link>.
        </p>

        {isCustomizing ? (
          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
            <label className="flex items-center justify-between text-foreground">
              <span>Strictly Essential (Sessions & Auth)</span>
              <input type="checkbox" checked disabled className="accent-primary" />
            </label>
            <label className="flex items-center justify-between text-foreground">
              <span>FastMCP Sidecar Diagnostics</span>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="accent-primary cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-foreground">
              <span>Anonymous Flight Performance Telemetry</span>
              <input
                type="checkbox"
                checked={preferences.telemetry}
                onChange={(e) => setPreferences({ ...preferences, telemetry: e.target.checked })}
                className="accent-primary cursor-pointer"
              />
            </label>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={handleSaveCustom}
                className="minimal-button-primary text-xs px-3 py-1.5 rounded-lg font-semibold"
              >
                Save Preferences
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60">
            <button
              onClick={() => setIsCustomizing(true)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>Customize</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNecessaryOnly}
                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-foreground font-medium cursor-pointer transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={handleAcceptAll}
                className="minimal-button-primary text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Accept All</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
