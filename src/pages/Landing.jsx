import { Container, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <motion.div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "1rem",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Animated Bootstrap Spinners as background accents */}
      <Spinner
        animation="border"
        variant="primary"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "12%",
          fontSize: "7rem",
          opacity: 0.12,
          zIndex: 0,
        }}
      />
      <Spinner
        animation="grow"
        variant="success"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "12%",
          right: "12%",
          fontSize: "6rem",
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      {/* Glass-style hero card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Container
          className="text-center rounded-4 shadow-lg p-5"
          style={{
            zIndex: 1,
            maxWidth: 520,
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
        >
          {/* Headline */}
          <h1 className="fw-bold mb-3" style={{ fontSize: "2.2rem" }}>
            🚀 Ace Your Interviews with <span className="text-primary">AI</span>
          </h1>

          {/* Subtext */}
          <p className="text-muted mb-4" style={{ fontSize: "1.1rem" }}>
            Upload your resume, practice with tailored questions, and get{" "}
            <span className="fw-semibold">instant performance feedback</span>.
          </p>

          {/* Call to Actions */}
          <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button as={Link} to="/signup" variant="primary" size="lg">
                Get Started
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                as={Link}
                to="/login"
                variant="outline-dark"
                size="lg"
                className="fw-semibold"
              >
                I already have an account
              </Button>
            </motion.div>
          </div>

          {/* Small trust note */}
          <p className="mt-4 text-muted" style={{ fontSize: "0.9rem" }}>
            ✅ 1000+ candidates improved their interview skills
          </p>
        </Container>
      </motion.div>
    </motion.div>
  );
}
