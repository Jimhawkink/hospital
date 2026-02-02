import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import DashboardLayout from "./layouts/DashboardLayout";
import AdminPanelLayout from "./layouts/AdminPanelLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import PatientRegistrationPage from "./pages/PatientRegistrationPage";
import EncounterListPage from "./pages/EncounterListPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MessagingPage from "./pages/MessagingPage";
import BillingPage from "./pages/BillingPage";
import ReportsPage from "./pages/ReportsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import InvestigationPage from "./pages/InvestigationPage";
import TriageEncounterPage from "./pages/TriageEncounterPage";
import PatientEncounterPage from "./pages/PatientEncounterPage";

// Admin Panel Pages
import OrganisationSettingsForm from "./pages/OrganisationSettingsForm";
import RevenueTrackingPage from "./pages/RevenueTrackingPage";
import ExpenseHistoryPage from "./pages/ExpenseHistoryPage";
import ExpenseSummaryPage from "./pages/ExpenseSummaryPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import StockManagementPage from "./pages/StockManagementPage";

// New Component for Triage Dashboard using TriageEncounterPage
const TriageDashboard = () => {
  return (
    <div className="flex h-full">
      {/* TriageEncounterPage handling both triage and history */}
      <div className="w-full p-4 overflow-auto">
        <TriageEncounterPage />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("hms_token"));

  const handleLogin = () => {
    setToken(localStorage.getItem("hms_token"));
  };

  console.log("App rendering, token:", !!token);

  return (
    <Routes>
      {/* LOGIN PAGE */}
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

      {/* REDIRECT ROUTE FOR LOGIN */}
      <Route path="/NewDashboardLayout" element={<Navigate to="/dashboard" replace />} />

      {token ? (
        <>
          {/* DASHBOARD */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/new" element={<PatientRegistrationPage />} />
            <Route path="encounters" element={<EncounterListPage />} />
            <Route path="schedule" element={<AppointmentsPage />} />
            <Route path="messaging" element={<MessagingPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="triage" element={<TriageDashboard />} />
            <Route path="encounters/triage/:patientId" element={<PatientEncounterPage />} />
            <Route path="patient-encounter/:patientId" element={<PatientEncounterPage />} />
            <Route path="encounters/complaints/:encounterId" element={<ComplaintsPage />} />
            <Route path="encounters/investigations/:encounterId" element={<InvestigationPage />} />
          </Route>

          {/* ADMIN PANEL WITH ITS OWN LAYOUT */}
          <Route path="/dashboard" element={<AdminPanelLayout />}>
            <Route path="organisation-settings" element={<OrganisationSettingsForm />} />
            <Route path="revenue-tracking" element={<RevenueTrackingPage />} />
            <Route path="expenses/history" element={<ExpenseHistoryPage />} />
            <Route path="expenses/summary" element={<ExpenseSummaryPage />} />
            <Route path="staff-management" element={<StaffManagementPage />} />
            <Route path="stock-management" element={<StockManagementPage />} />
          </Route>

          {/* Catch-all when logged in */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default App;