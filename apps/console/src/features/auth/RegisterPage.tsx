import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/layout/AuthLayout";
import { OAuthButtons } from "./OAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signup } from "@/lib/api";
import { ArrowRight, CheckCircle2, Loader2, Lock, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute simple password strength score (0 to 3)
  const strength = (() => {
    if (!password) return 0;
    let score = 1;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    return score;
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError("Please complete all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signup(email.trim(), password, name.trim());
      // Direct newly registered users into the onboarding wizard!
      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your Bee account"
      subtitle="Join thousands of engineers deploying autonomous event-driven AI pipelines."
      badgeText="Autonomous Engineering Platform"
    >
      <Card className="border-border/70 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Start free with local SQLite or connect your enterprise cloud.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <OAuthButtons mode="signup" />

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-foreground/90">
                Full Name
              </Label>
              <div className="relative">
                <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-10 border-border/80 focus-visible:ring-primary/40 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground/90">
                Work Email
              </Label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ada@coengineer.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 border-border/80 focus-visible:ring-primary/40 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground/90">
                Password
              </Label>
              <div className="relative">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 border-border/80 focus-visible:ring-primary/40 text-sm"
                  required
                />
              </div>

              {/* Password strength indicators */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1.5 h-1">
                    <div
                      className={`flex-1 rounded-full transition-colors ${
                        strength >= 1 ? "bg-amber-500" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full transition-colors ${
                        strength >= 2 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full transition-colors ${
                        strength >= 3 ? "bg-emerald-500" : "bg-muted"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Strength</span>
                    <span className="font-medium text-foreground/80">
                      {strength === 1 && "Basic"}
                      {strength === 2 && "Good"}
                      {strength === 3 && "Strong"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="glow"
                disabled={loading}
                className="w-full h-10 font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Provisioning Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>Includes 1,000 free flight credits + full MCP platform registry.</span>
          </div>

          <div className="pt-1 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
