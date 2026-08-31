import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Bee work without requiring API keys or environment variables?",
      a: "Bee comes pre-configured with a zero-config managed AI fallback powered by Google Gemini Flash. Furthermore, all external tool connectors (GitHub, Google, Slack, Discord) connect through 1-Click OAuth popup windows directly in the UI. Your tokens are securely encrypted locally with AES-256.",
    },
    {
      q: "What is the Adaptive Self-Healing Flight Loop?",
      a: "When a test assertion, linter, or build command fails, Bee doesn't stop and ask you to fix it. Instead, its Fixer Worker captures the exact stack trace, locates the offending code with AST ripgrep, writes the repair, and re-runs the sandbox tests until verification succeeds with 0 errors.",
    },
    {
      q: "How do Zero-Trust Approval Gates protect my repository?",
      a: "Bee enforces a strict policy engine. Any destructive or critical action (e.g. git_push, database schema migrations, production deployments) pauses automatically and sends an instant authorization alert to your Desktop Attention Center and WhatsApp/Slack with 1-click [Authorize] / [Reject] buttons.",
    },
    {
      q: "Can I bring my own LLM keys or run on-premise models?",
      a: "Yes! In the Hive Registry Settings, you can enable BYOK mode and provide your own OpenAI, Anthropic, Gemini, Groq, or DeepSeek API key. Bee also supports any local OpenAI-compatible endpoint such as Ollama or vLLM running Llama 3.3 70B.",
    },
    {
      q: "Which operating systems are supported for native desktop download?",
      a: "Bee is distributed natively for Windows (.exe installer), macOS (.dmg Apple Silicon & Intel), and Linux (.AppImage & .deb packages). The website auto-detects your operating system for an instant 1-click download.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-6 relative z-10 border-t border-zinc-800/80 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white">
            Everything you need to know about Bee
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-amber-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-amber-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
