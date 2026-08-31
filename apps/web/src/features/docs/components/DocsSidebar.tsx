import { Search, Download, Key, Cpu, Boxes, Shield, DollarSign, Layers } from "lucide-react";
import { SECTIONS, type DocSection } from "../content/docsData";

interface DocsSidebarProps {
  activeSection: DocSection;
  onSelectSection: (id: DocSection) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Download: <Download className="w-4 h-4" />,
  Key: <Key className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  Boxes: <Boxes className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
};

export function DocsSidebar({
  activeSection,
  onSelectSection,
  searchQuery,
  onSearchChange,
}: DocsSidebarProps) {
  const filtered = SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ["Getting Started", "Core Concepts", "Ecosystem", "Security & API"] as const;

  return (
    <aside className="w-full md:w-72 border-r border-zinc-800/80 p-5 space-y-6 shrink-0 bg-zinc-950/40">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-500/50"
        />
      </div>

      {/* Navigation List */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catSections = filtered.filter((s) => s.category === cat);
          if (catSections.length === 0) return null;

          return (
            <div key={cat} className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-2.5">
                {cat}
              </div>
              {catSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    activeSection === s.id
                      ? "bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                  }`}
                >
                  <span className={activeSection === s.id ? "text-amber-400" : "text-zinc-500"}>
                    {ICON_MAP[s.iconName]}
                  </span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
