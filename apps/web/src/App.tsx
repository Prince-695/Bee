import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./features/landing/LandingPage";
import DocsPage from "./features/docs/DocsPage";
import LoginPage from "./features/auth/LoginPage";
import SignUpPage from "./features/auth/SignUpPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}
