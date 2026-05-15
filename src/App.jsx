import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { AuthProvider } from "./context/AuthContext";
import AppNavbar from "./components/AppNavbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./pages/ResumeUpload";
import Interview from "./pages/Interview";
import Performance from "./pages/Performance";

import axios from "axios";
import { useEffect } from "react";

function AppShell({ children }) {
  return (
    <>
      <AppNavbar />
      <Container fluid className="py-4">
        <Row>
          <Col xs="auto" className="d-none d-md-block">
            <Sidebar />
          </Col>
          <Col>{children}</Col>
        </Row>
      </Container>
    </>
  );
}

export default function App() {
  // ✅ Runs only once at app startup — not on every page change
  useEffect(() => {
    axios.post("http://localhost:5001/api/test", { message: "Hello from frontend!" })
      .then(r => console.log("✅ Backend:", r.data))
      .catch(err => console.error("❌ Error:", err.message));
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* /app → redirect to /app/dashboard */}
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

          {/* Protected routes */}
          <Route path="/app/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
          <Route path="/app/resume"    element={<ProtectedRoute><AppShell><ResumeUpload /></AppShell></ProtectedRoute>} />
          <Route path="/app/interview" element={<ProtectedRoute><AppShell><Interview /></AppShell></ProtectedRoute>} />
          <Route path="/app/performance" element={<ProtectedRoute><AppShell><Performance /></AppShell></ProtectedRoute>} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}