import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import StatusPage from "./features/status/StatusPage";
import RoutePage from "./features/mission-control/RoutePage";
import ConversationPage from "./features/conversation/ConversationPage";
import HivePage from "./features/hive-registry/HivePage";
import HooksPage from "./features/signal-engine/HooksPage";
import ChatHistoryPage from "./features/flight-logs/ChatHistoryPage";
import { DesktopLayout } from "./layout/DesktopLayout";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <TooltipProvider>
      <Router>
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

            {/* Backwards compatible /app routes */}
            <Route path="/app" element={<Navigate to="/" replace />} />
            <Route path="/app/status" element={<Navigate to="/" replace />} />
            <Route path="/app/route/:routeId" element={<RoutePage />} />
            <Route path="/app/hive" element={<Navigate to="/hive" replace />} />
            <Route path="/app/history" element={<Navigate to="/logs" replace />} />
            <Route path="/app/hooks" element={<Navigate to="/hooks" replace />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DesktopLayout>
      </Router>
    </TooltipProvider>
  );
}
