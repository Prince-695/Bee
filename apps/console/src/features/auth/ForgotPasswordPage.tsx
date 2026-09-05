import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { forgotPassword, resetPassword } from "@/lib/api";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await forgotPassword(email.trim());
      setInfoMessage(res?.message || "Password reset code sent to your email.");
      setStep("reset");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setError("Please enter both the reset code and your new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await resetPassword(email.trim(), otpCode.trim(), newPassword);
      setStep("success");
    } catch (err: any) {
      setError(err?.message || "Invalid or expired reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recover your Bee account"
      subtitle="Follow the Zero-Trust recovery steps to safely reset your credentials."
      badgeText="Account Security & Recovery"
    >
      <Card className="border-border/70 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight">
            {step === "request" && "Forgot Password"}
            {step === "reset" && "Enter Reset Code"}
            {step === "success" && "Password Reset Complete"}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {step === "request" && "Enter your email to receive a 6-digit verification code."}
            {step === "reset" && `A 6-digit code has been dispatched to ${email}.`}
            {step === "success" && "Your password has been updated and active sessions rotated."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {infoMessage && step === "reset" && (
            <div className="p-3 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === "request" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground/90">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="engineer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10 border-border/80 focus-visible:ring-primary/40 text-sm"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="glow"
                disabled={loading}
                className="w-full h-10 font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Reset Code</span>
                )}
              </Button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-xs font-medium text-foreground/90">
                  6-Digit Reset Code
                </Label>
                <div className="relative">
                  <KeyRound className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="pl-9 h-10 tracking-widest font-mono text-center text-base border-border/80 focus-visible:ring-primary/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-medium text-foreground/90">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 h-10 border-border/80 focus-visible:ring-primary/40 text-sm"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="glow"
                disabled={loading}
                className="w-full h-10 font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <span>Confirm New Password</span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Didn&apos;t receive the code? Try another email
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center py-2">
              <div className="size-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-sm text-foreground">
                Your password has been successfully reset. You can now sign in with your new credentials.
              </p>
              <Link to="/auth/login" className="block">
                <Button variant="glow" className="w-full h-10 font-semibold">
                  Sign In Now
                </Button>
              </Link>
            </div>
          )}

          <div className="pt-2 text-center text-xs">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
