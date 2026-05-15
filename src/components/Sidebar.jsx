import { Nav } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Home, FileText, Mic, BarChart2 } from "lucide-react"; // icons

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { to: "/app", label: "Dashboard", icon: <Home size={18} /> },
    { to: "/app/resume", label: "Resume Upload", icon: <FileText size={18} /> },
    { to: "/app/interview", label: "Mock Interview", icon: <Mic size={18} /> },
    { to: "/app/performance", label: "Performance", icon: <BarChart2 size={18} /> },
  ];

  return (
    <motion.div
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-end p-3 d-flex flex-column"
      style={{
        width: 240,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)",
        fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
      }}
    >
      <h4 className="fw-bold text-primary mb-4 px-2">InterviewPrep.ai</h4>
      <Nav className="flex-column gap-2">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.to;
          return (
            <LinkContainer to={item.to} key={idx}>
              <motion.div
                whileHover={{ scale: 1.04, x: 5 }}
                whileTap={{ scale: 0.97 }}
                className={`d-flex align-items-center px-3 py-2 rounded-3 fw-medium cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-dark bg-transparent"
                }`}
                style={{
                  transition: "all 0.25s ease",
                  fontSize: "0.95rem",
                  letterSpacing: "0.2px",
                }}
              >
                <span className="me-2">{item.icon}</span>
                {item.label}
              </motion.div>
            </LinkContainer>
          );
        })}
      </Nav>
    </motion.div>
  );
}
