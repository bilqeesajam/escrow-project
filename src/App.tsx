import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ChooseRolePage from "./pages/ChooseRolePage";
import KYCPage from "./pages/KYCPage";
import KYCPendingPage from "./pages/KYCPendingPage";
import DashboardRedirect from "./pages/DashboardRedirect";
import WalletPage from "./pages/users/WalletPage";
import PostGigPage from "./pages/users/PostGigPage";
import MyGigsPage from "./pages/users/MyGigsPage";
import GigDetailPage from "./pages/GigDetailPage";
import MarketplacePage from "./pages/hustlers/MarketplacePage";
import MyJobsPage from "./pages/hustlers/MyJobsPage";
import EarningsPage from "./pages/hustlers/EarningsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminKYCPage from "./pages/admin/AdminKYCPage";
import AdminGigsPage from "./pages/admin/AdminGigsPage";
import AdminDisputesPage from "./pages/admin/AdminDisputesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPricingPage from "./pages/admin/AdminPricingPage";
import AdminPricingOverridesPage from "./pages/admin/AdminPricingOverridesPage";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/choose-role" element={<ChooseRolePage />} />
            <Route path="/kyc" element={<KYCPage />} />
            <Route path="/kyc-pending" element={<KYCPendingPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/post-gig" element={<ProtectedRoute><PostGigPage /></ProtectedRoute>} />
            <Route path="/my-gigs" element={<ProtectedRoute><MyGigsPage /></ProtectedRoute>} />
            <Route path="/gig/:id" element={<ProtectedRoute><GigDetailPage /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
            <Route path="/my-jobs" element={<ProtectedRoute><MyJobsPage /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/kyc" element={<ProtectedRoute requireRole="admin"><AdminKYCPage /></ProtectedRoute>} />
            <Route path="/admin/gigs" element={<ProtectedRoute requireRole="admin"><AdminGigsPage /></ProtectedRoute>} />
            <Route path="/admin/disputes" element={<ProtectedRoute requireRole="admin"><AdminDisputesPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireRole="admin"><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/pricing" element={<ProtectedRoute requireRole="admin"><AdminPricingPage /></ProtectedRoute>} />
            <Route path="/admin/pricing-overrides" element={<ProtectedRoute requireRole="admin"><AdminPricingOverridesPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
  </QueryClientProvider>
);
}

export default App;
