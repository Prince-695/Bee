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
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="skeuo-glass-deck rounded-2xl p-5 border border-primary/40 shadow-2xl space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>Zero-Retention Privacy & Cookie Governance</span>
          </div>
          <button
            onClick={handleNecessaryOnly}
            className="text-muted-foreground hover:text-foreground"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Bee uses strictly functional session tokens and anonymous performance telemetry to power autonomous agent swarms. We never sell your data or profile codebases for ads. Read our{" "}
          <Link to="/privacy" className="text-primary hover:underline font-medium">
            Privacy Policy
          </Link>.
        </p>

        {isCustomizing ? (
          <div className="pt-2 border-t border-border/50 space-y-2 text-xs">
            <label className="flex items-center justify-between text-muted-foreground">
              <span>Essential Session Authentication</span>
              <input type="checkbox" checked disabled className="accent-primary" />
            </label>
            <label className="flex items-center justify-between text-foreground">
              <span>Functional Theme & Layout Cache</span>
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
                className="skeuo-button-primary text-xs px-3.5 py-1.5 rounded-xl font-bold"
              >
                Save Preferences
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/40">
            <button
              onClick={() => setIsCustomizing(true)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
            >
              <Sliders className="w-3 h-3" />
              <span>Customize</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNecessaryOnly}
                className="skeuo-button-secondary text-xs px-3 py-1.5 rounded-xl font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Essential Only
              </button>
              <button
                onClick={handleAcceptAll}
                className="skeuo-button-primary text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
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
