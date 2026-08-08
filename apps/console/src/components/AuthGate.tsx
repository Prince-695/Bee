import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getMe } from "@/lib/api";

export function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    const token = getAuthToken();
    if (!token) {
      setOk(false);
      setReady(true);
      return;
    }
    void getMe()
      .then(() => {
        if (mounted) {
          setOk(true);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setOk(false);
          setReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!ok) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
