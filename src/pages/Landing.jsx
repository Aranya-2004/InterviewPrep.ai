import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <motion.div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        // Deep dark slate / rich indigo background
        background: "radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "1.5rem",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Ambient Backdrop Glow 1 (Top Left) */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-15%",
          left: "-15%",
          width: "55vw",
          height: "55vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient Backdrop Glow 2 (Bottom Right) */}
      <motion.div
        animate={{
          scale: [1.15, 1, 1.15],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-15%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      {/* Glassmorphic Hero Card Container */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        style={{ width: "100%", maxWidth: "580px", zIndex: 1 }}
      >
        <Container
          className="text-center rounded-4 p-4 p-sm-5"
          style={{
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Context Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="d-inline-flex align-items-center mb-4 px-3 py-1.5 rounded-pill"
            style={{
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              color: "#a5b4fc",
              fontSize: "0.8rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            ✨ The Next-Gen Interview Simulator
          </motion.div>

          {/* Typography Heading with Custom Text Gradient */}
          <h1 
            className="fw-bold mb-3" 
            style={{ 
              fontSize: "2.5rem", 
              color: "#f8fafc",
              lineHeight: 1.25,
              letterSpacing: "-0.02em"
            }}
          >
            Ace Your Interviews <br />
            <span 
              style={{ 
                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Powered by AI
            </span>
          </h1>

          {/* Description Subtext */}
          <p 
            className="mb-5 px-0 px-sm-2" 
            style={{ 
              fontSize: "1.05rem", 
              color: "#94a3b8", 
              lineHeight: 1.65,
              fontWeight: 400 
            }}
          >
            Upload your resume, train with intelligent role-specific questions, and unlock actionable, professional feedback in seconds.
          </p>

          {/* Action Buttons Layout */}
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-stretch">
            {/* Primary CTA */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-grow-1">
              <Button 
                as={Link} 
                to="/signup" 
                size="lg"
                className="w-100 border-0 py-3 fw-semibold"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                  boxShadow: "0 4px 20px rgba(79, 70, 229, 0.3)",
                  fontSize: "1rem",
                  borderRadius: "10px",
                  transition: "box-shadow 0.2s ease"
                }}
              >
                Get Started Free
              </Button>
            </motion.div>
            
            {/* Secondary CTA */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-grow-1">
              <Button
                as={Link}
                to="/login"
                variant="outline-light"
                size="lg"
                className="w-100 py-3 fw-semibold"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.03)",
                  fontSize: "1rem",
                  color: "#e2e8f0",
                  borderRadius: "10px"
                }}
              >
                Sign In
              </Button>
            </motion.div>
          </div>

          {/* Content Divider */}
          <hr style={{ borderColor: "rgba(255, 255, 255, 0.08)", margin: "2rem 0 1.5rem 0" }} />

          {/* Trust Element Footer */}
          <div 
            className="d-flex align-items-center justify-content-center gap-2"
            style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}
          >
            <span style={{ color: "#10b981", fontSize: "0.7rem" }}>●</span> 
            Trusted by 1,000+ applicants worldwide
          </div>
        </Container>
      </motion.div>
    </motion.div>
  );
}