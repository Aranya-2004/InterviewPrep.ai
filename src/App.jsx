import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import {
  Container,
  Row,
  Col
} from "react-bootstrap";

import {
  useEffect
} from "react";

import axios from "axios";

import {
  AuthProvider,
  useAuth
} from "./context/AuthContext";

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

import {
  connectSocket,
  disconnectSocket
} from "./services/socket";


// ================= APP SHELL =================

function AppShell({ children }) {

  return (
    <>
      <AppNavbar />

      <Container fluid className="py-4">

        <Row>

          <Col
            xs="auto"
            className="d-none d-md-block"
          >
            <Sidebar />
          </Col>

          <Col>
            {children}
          </Col>

        </Row>

      </Container>
    </>
  );
}


// ================= APP CONTENT =================

function AppContent() {

  const { user } = useAuth();

  // ================= BACKEND TEST =================

  useEffect(() => {

    axios.post(
      "`${import.meta.env.VITE_API_URL}/api/test`",
      {
        message: "Hello from frontend!"
      }
    )
    .then((r) =>
      console.log("✅ Backend:", r.data)
    )
    .catch((err) =>
      console.error("❌ Error:", err.message)
    );

  }, []);


  // ================= SOCKET =================

  useEffect(() => {

    if (user?.id) {

      connectSocket(user.id);

    }

    return () => {

      disconnectSocket();

    };

  }, [user]);


  return (

    <BrowserRouter>

      <Routes>

        {/* PUBLIC */}

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* REDIRECT */}

        <Route
          path="/app"
          element={
            <Navigate
              to="/app/dashboard"
              replace
            />
          }
        />


        {/* PROTECTED */}

        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/resume"
          element={
            <ProtectedRoute>
              <AppShell>
                <ResumeUpload />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/interview"
          element={
            <ProtectedRoute>
              <AppShell>
                <Interview />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/performance"
          element={
            <ProtectedRoute>
              <AppShell>
                <Performance />
              </AppShell>
            </ProtectedRoute>
          }
        />


        {/* 404 */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


// ================= MAIN APP =================

export default function App() {

  return (

    <AuthProvider>

      <AppContent />

    </AuthProvider>

  );
}