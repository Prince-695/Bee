import React, { useState } from "react";
import {
  X,
  Mail,
  UserCheck,
  Shield,
  Send,
  CheckCircle2,
} from "lucide-react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("engineer");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onInvite(email.trim(), role);
      setIsSubmitting(false);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        setEmail("");
        setMessage("");
        onClose();
      }, 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="skeuo-glass-deck w-full max-w-lg rounded-2xl border border-primary/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(255,178,44,0.2)]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Invite Team Member</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grant autonomous workspace access with RBAC role privileges.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {successMsg ? (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Invitation Sent!</h4>
              <p className="text-xs text-muted-foreground">
                An invitation email has been sent to {email}.
              </p>
            </div>
          ) : (
            <>
              {/* Email input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Colleague Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="engineer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-mono"
                />
              </div>

              {/* RBAC Role Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" /> RBAC Permissions Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "admin",
                      label: "Admin",
                      desc: "Full config & billing",
                    },
                    {
                      id: "engineer",
                      label: "Engineer",
                      desc: "Launch & approve flights",
                    },
                    {
                      id: "viewer",
                      label: "Viewer",
                      desc: "Read-only logs",
                    },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        role === r.id
                          ? "bg-primary/15 border-primary shadow-[0_0_12px_rgba(255,178,44,0.2)]"
                          : "bg-secondary/40 border-border/60 hover:border-border"
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{r.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Welcome Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Personal Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Welcome to our autonomous engineering hive..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 resize-none"
                />
              </div>

              {/* Footer Pushers */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Inviting..." : "Send Invitation"}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
