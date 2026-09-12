import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AuthLayout } from "@/layout/AuthLayout";
import { setAuthToken } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token") || searchParams.get("access_token");
    const isNewUser = searchParams.get("new_user") === "true";
    const errorParam = searchParams.get("error") || searchParams.get("error_description");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (token) {
      setAuthToken(token);
      if (isNewUser) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } else {
      // In mock/local desktop dev mode, if code is present, issue demo session
      const code = searchParams.get("code");
      if (code) {
        setAuthToken(`oauth_token_${code.slice(0, 12)}`);
        navigate("/onboarding", { replace: true });
      } else {
        setError("Missing authentication tokens from provider callback.");
      }
    }
  }, [searchParams, navigate]);

  return (
    <AuthLayout
      title="Authenticating with Provider"
      subtitle="Finalizing single sign-on security exchange..."
      badgeText="OAuth Provider Handshake"
    >
      <Card className="border-border/70 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
          {error ? (
            <>
              <div className="size-12 rounded-full bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center">
                <AlertCircle className="size-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-foreground">Authentication Error</h3>
                <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              </div>
              <Link to="/auth/login">
                <Button variant="outline" className="text-xs">
                  Return to Sign In
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Connecting to Bee Co-Engineer...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
