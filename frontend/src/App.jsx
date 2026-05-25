import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Matches from "./pages/Matches.jsx";
import Leagues from "./pages/Leagues.jsx";
import Jobs from "./pages/Jobs.jsx";
import GeneratedReport from "./pages/GeneratedReport.jsx";
import GenerateReport from "./pages/GenerateReport.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="matches" element={<Matches />} />
            <Route path="leagues" element={<Leagues />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="report/result" element={<GeneratedReport />} />
            <Route path="generate" element={<GenerateReport />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
