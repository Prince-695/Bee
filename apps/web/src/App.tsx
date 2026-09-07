import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./features/landing/LandingPage";
import FeaturesPage from "./features/features-page/FeaturesPage";
import ArchitecturePage from "./features/architecture/ArchitecturePage";
import PricingPage from "./features/pricing/PricingPage";
import ContactPage from "./features/contact/ContactPage";
import DocsPage from "./features/docs/DocsPage";
import LoginPage from "./features/auth/LoginPage";
import SignUpPage from "./features/auth/SignUpPage";
import PrivacyPolicyPage from "./features/legal/PrivacyPolicyPage";
import TermsOfServicePage from "./features/legal/TermsOfServicePage";
import SecurityPage from "./features/legal/SecurityPage";
import NotFoundPage from "./features/not-found/NotFoundPage";
import { CookieConsentBanner } from "./components/CookieConsentBanner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Compliance & Legal Suite */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieConsentBanner />
    </BrowserRouter>
  );
}
