import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MonitorsPage from "./pages/monitors/MonitorsPage";
import MonitorDetailsPage from "./pages/monitors/MonitorDetailsPage";
import WebhooksPage from "./pages/webhooks/WebhooksPage";
import AppLayout from "./layouts/AppLayout";
import PlaceholderPage from "./pages/PlaceholderPage";
import SettingsPage from "./pages/SettingsPage";
import AccountPage from "./pages/AccountPage";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
        <Route path="/account" element={<AppLayout><AccountPage /></AppLayout>} />
        <Route path="/help" element={<AppLayout><PlaceholderPage title="Help center" description="Guidance and support resources will be available here." /></AppLayout>} />
        <Route path="/monitors" element={<AppLayout><MonitorsPage /></AppLayout>} />
        <Route path="/monitors/:id" element={<AppLayout><MonitorDetailsPage /></AppLayout>} />
        <Route path="/monitors/:id/webhooks" element={<AppLayout><WebhooksPage /></AppLayout>} />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;