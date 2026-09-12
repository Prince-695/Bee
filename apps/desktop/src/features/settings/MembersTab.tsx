import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InviteMemberModal } from "./InviteMemberModal";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "owner" | "admin" | "engineer" | "viewer";
  twoFactorEnabled: boolean;
  joinedAt: string;
  lastActive: string;
}

const SEED_MEMBERS: TeamMember[] = [
  {
    id: "usr_001",
    name: "Prince Rathod",
    email: "prince.rathod@enterprise.io",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "owner",
    twoFactorEnabled: true,
    joinedAt: "Jan 15, 2026",
    lastActive: "Active now",
  },
  {
    id: "usr_002",
    name: "Alex Rivera",
    email: "alex.rivera@enterprise.io",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "admin",
    twoFactorEnabled: true,
    joinedAt: "Feb 02, 2026",
    lastActive: "12m ago",
  },
  {
    id: "usr_003",
    name: "Elena Rostova",
    email: "elena.rostova@enterprise.io",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "engineer",
    twoFactorEnabled: true,
    joinedAt: "Feb 18, 2026",
    lastActive: "1h ago",
  },
  {
    id: "usr_004",
    name: "Devon Chen",
    email: "devon.chen@enterprise.io",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "engineer",
    twoFactorEnabled: false,
    joinedAt: "Mar 01, 2026",
    lastActive: "Yesterday",
  },
  {
    id: "usr_005",
    name: "Sarah Lindqvist",
    email: "sarah.l@enterprise.io",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    role: "viewer",
    twoFactorEnabled: true,
    joinedAt: "Mar 04, 2026",
    lastActive: "3d ago",
  },
];

export const MembersTab: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(SEED_MEMBERS);
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleInvite = (email: string, role: string) => {
    const newMember: TeamMember = {
      id: `usr_${Math.random().toString(36).slice(2, 8)}`,
      name: email.split("@")[0].replace(".", " "),
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      role: role as TeamMember["role"],
      twoFactorEnabled: false,
      joinedAt: "Just now",
      lastActive: "Pending invite",
    };
    setMembers([newMember, ...members]);
  };

  const handleRoleChange = (memberId: string, newRole: TeamMember["role"]) => {
    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
  };

  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  const getRoleBadge = (role: TeamMember["role"]) => {
    switch (role) {
      case "owner":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-primary/20 text-primary border border-primary/30 shadow-[0_0_8px_rgba(255,178,44,0.3)]">
            Owner
          </span>
        );
      case "admin":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
            Admin
          </span>
        );
      case "engineer":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            Engineer
          </span>
        );
      case "viewer":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-secondary/80 text-muted-foreground border border-border">
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Organization Overview Capsule */}
      <div className="skeuo-glass-card rounded-2xl p-5 border border-border/70 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,178,44,0.2)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Cyberdyne Systems Org</h3>
                <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/10 border-primary/30 font-bold">
                  PRO PLAN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multi-tenant organization with Role-Based Access Control (RBAC).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-mono font-bold text-foreground">
                {members.length} / 10 Seats Used
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {10 - members.length} seats remaining
              </div>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="skeuo-button-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          </div>
        </div>

        {/* Seat Allocation Progress Bar */}
        <div className="mt-4 space-y-1">
          <div className="h-2 w-full rounded-full bg-secondary/80 overflow-hidden border border-border/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${(members.length / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Team Roster Header & Search */}
      <div className="skeuo-glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div>
            <h4 className="text-sm font-bold text-foreground">Active Team Roster</h4>
            <p className="text-xs text-muted-foreground">
              Manage member roles, permissions, and security enforcement.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-secondary/50 border border-border/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/60 text-foreground font-mono"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary/60 border-b border-border/60 text-muted-foreground font-mono text-[10px] uppercase">
                <th className="p-3.5">Member</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">2FA Status</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5">Last Active</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                  {/* Member Avatar & Name */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                      <div>
                        <div className="font-bold font-sans text-foreground text-xs flex items-center gap-1.5">
                          {member.name}
                          {member.role === "owner" && (
                            <Sparkles className="w-3 h-3 text-primary fill-primary" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role Selector */}
                  <td className="p-3.5">
                    {member.role === "owner" ? (
                      getRoleBadge("owner")
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as TeamMember["role"])
                        }
                        className="text-[11px] font-mono font-semibold bg-secondary/80 border border-border/70 rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
                      >
                        <option value="admin">Admin</option>
                        <option value="engineer">Engineer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>

                  {/* 2FA Status */}
                  <td className="p-3.5">
                    {member.twoFactorEnabled ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                        <Shield className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="p-3.5 text-muted-foreground text-[11px]">
                    {member.joinedAt}
                  </td>

                  {/* Last Active */}
                  <td className="p-3.5 text-foreground/80 text-[11px]">
                    {member.lastActive}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
};
