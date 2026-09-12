import React, { useState } from "react";
import {
  User,
  Shield,
  QrCode,
  CheckCircle2,
  Lock,
  Smartphone,
  Laptop,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ProfileSecurityTab: React.FC = () => {
  const [fullName, setFullName] = useState("Prince Rathod");
  const [email] = useState("prince.rathod@enterprise.io");
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sessions, setSessions] = useState([
    {
      id: "sess_1",
      device: "Desktop Workstation (Linux / Chrome)",
      ip: "192.168.1.104",
      lastActive: "Active now",
      isCurrent: true,
    },
    {
      id: "sess_2",
      device: "Mobile Approval Client (iOS / Safari)",
      ip: "172.56.21.9",
      lastActive: "Yesterday at 4:15 PM",
      isCurrent: false,
    },
  ]);

  const revokeOtherSessions = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    alert("Revoked all other active sessions.");
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <div className="skeuo-glass-card rounded-2xl p-5 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">{fullName}</h3>
              <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/10 border-primary/30">
                OWNER
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{email}</p>
          </div>
        </div>

        <button
          onClick={() => alert("Profile updated successfully.")}
          className="skeuo-button-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Save Profile</span>
        </button>
      </div>

      {/* Edit Profile Form */}
      <div className="skeuo-glass-card rounded-2xl p-5 space-y-4 border border-border/60">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Personal Identity
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/70 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Work Email
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3.5 py-2 rounded-xl bg-secondary/30 border border-border/50 text-xs font-mono text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="skeuo-glass-card rounded-2xl p-5 space-y-4 border border-border/60">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                TOTP Two-Factor Authentication (2FA)
              </h4>
              <p className="text-xs text-muted-foreground">
                Secure autonomous approvals with Google Authenticator, 1Password, or Authy.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (is2FAEnabled) {
                setIs2FAEnabled(false);
              } else {
                setShowQrModal(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              is2FAEnabled
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                : "bg-secondary border-border text-muted-foreground"
            }`}
          >
            {is2FAEnabled ? "Enforced (Disable)" : "Enable 2FA"}
          </button>
        </div>

        {is2FAEnabled && (
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>2FA is active. Required for production git commit and MCP tool authorizations.</span>
          </div>
        )}
      </div>

      {/* Active Login Sessions */}
      <div className="skeuo-glass-card rounded-2xl p-5 space-y-4 border border-border/60">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Active Login Sessions
            </h4>
            <p className="text-xs text-muted-foreground">
              Devices currently authorized to access your Bee workspace.
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={revokeOtherSessions}
              className="text-xs text-red-400 hover:text-red-300 font-medium"
            >
              Revoke Other Sessions
            </button>
          )}
        </div>

        <div className="space-y-2">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border/70 flex items-center justify-center text-muted-foreground">
                  {sess.device.includes("Mobile") ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <Laptop className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    {sess.device}
                    {sess.isCurrent && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        THIS DEVICE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    IP: {sess.ip} • {sess.lastActive}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Setup Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="skeuo-glass-deck w-full max-w-sm rounded-2xl p-6 border border-primary/40 space-y-4 text-center">
            <h4 className="text-sm font-bold text-foreground">Scan 2FA Authenticator QR</h4>
            <p className="text-xs text-muted-foreground">
              Scan with Google Authenticator or 1Password.
            </p>
            <div className="w-40 h-40 mx-auto rounded-2xl bg-white p-3 flex items-center justify-center shadow-inner">
              <QrCode className="w-32 h-32 text-black" />
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Secret: <span className="text-primary font-bold">JBSWY3DPEHPK3PXP</span>
            </div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full text-center tracking-widest text-base font-mono px-3 py-2 rounded-xl bg-secondary/60 border border-border text-foreground"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIs2FAEnabled(true);
                  setShowQrModal(false);
                }}
                disabled={otpCode.length < 6}
                className="flex-1 skeuo-button-primary py-2 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Verify & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
