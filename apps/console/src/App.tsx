import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import StatusPage from "./features/status/StatusPage";
import RoutePage from "./features/mission-control/RoutePage";
import ConversationPage from "./features/conversation/ConversationPage";
import HivePage from "./features/hive-registry/HivePage";
import HooksPage from "./features/signal-engine/HooksPage";
import ChatHistoryPage from "./features/flight-logs/ChatHistoryPage";
import SettingsPage from "./features/settings/SettingsPage";
import ConsoleNotFoundPage from "./features/not-found/ConsoleNotFoundPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import OAuthCallbackPage from "./features/auth/OAuthCallbackPage";
import OnboardingPage from "./features/onboarding/OnboardingPage";
import { DesktopLayout } from "./layout/DesktopLayout";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          {/* Dedicated Auth Suite Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          {/* 3-Step Onboarding Wizard */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/:step" element={<OnboardingPage />} />

          {/* Core Desktop App routes inside DesktopLayout */}
          <Route
            path="/*"
            element={
              <DesktopLayout>
                <Routes>
                  {/* Desktop root boots directly to Teammate Board */}
                  <Route path="/" element={<StatusPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/route/:routeId" element={<RoutePage />} />
                  <Route path="/chat" element={<ConversationPage />} />
                  <Route path="/hive" element={<HivePage />} />
                  <Route path="/logs" element={<ChatHistoryPage />} />
                  <Route path="/hooks" element={<HooksPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/:tab" element={<SettingsPage />} />

                  {/* Backwards compatible /app routes */}
                  <Route path="/app" element={<Navigate to="/" replace />} />
                  <Route path="/app/status" element={<Navigate to="/" replace />} />
                  <Route path="/app/route/:routeId" element={<RoutePage />} />
                  <Route path="/app/hive" element={<Navigate to="/hive" replace />} />
                  <Route path="/app/history" element={<Navigate to="/logs" replace />} />
                  <Route path="/app/hooks" element={<Navigate to="/hooks" replace />} />
                  <Route path="/app/settings" element={<Navigate to="/settings" replace />} />
                  <Route path="/app/settings/:tab" element={<SettingsPage />} />

                  {/* Fallback route */}
                  <Route path="*" element={<ConsoleNotFoundPage />} />
                </Routes>
              </DesktopLayout>
            }
          />
        </Routes>
      </Router>
    </TooltipProvider>
  );
}
