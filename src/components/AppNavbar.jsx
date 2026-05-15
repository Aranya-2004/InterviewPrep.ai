import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Simple avatar from user name/email
  const avatar = user?.name
    ? user.name[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ position: 'relative', zIndex: 100 }}>
      {/* Animated Gradient Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)',
          animation: 'navbarBgMove 12s ease-in-out infinite alternate',
          opacity: 0.93,
        }}
      />
      <style>
        {`
          @keyframes navbarBgMove {
            0% { filter: hue-rotate(0deg) brightness(1); }
            50% { filter: hue-rotate(30deg) brightness(1.08); }
            100% { filter: hue-rotate(-30deg) brightness(1); }
          }
        `}
      </style>

      {/* Navbar */}
      <Navbar
        expand="md"
        className="border-bottom shadow-sm"
        sticky="top"
        style={{
          background: 'transparent',
          zIndex: 2,
        }}
      >
        <Container>
          {/* Brand */}
          <LinkContainer to="/">
            <Navbar.Brand
              style={{
                fontWeight: 700,
                letterSpacing: '1px',
                fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
                transition: 'color 0.2s',
                cursor: 'pointer',
                color: '#fff',
                textShadow: '0 2px 8px rgba(99,102,241,0.18)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#ffe066')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#fff')}
            >
              InterviewPrep.ai
            </Navbar.Brand>
          </LinkContainer>

          {/* Hamburger Toggle */}
          <Navbar.Toggle
            aria-controls="main-navbar-nav"
            style={{
              backgroundColor: 'rgba(255,255,255,0.85)',
              border: 'none',
            }}
          />

          {/* Collapse Menu */}
          <Navbar.Collapse id="main-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {user ? (
                <NavDropdown
                  title={
                    <span style={{ color: '#fff' }}>
                      <span
                        className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center me-2"
                        style={{
                          width: 32,
                          height: 32,
                          fontWeight: 600,
                          fontSize: 18,
                          boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
                        }}
                      >
                        {avatar}
                      </span>
                      <span style={{ textShadow: '0 1px 4px #6366f1' }}>
                        {user.name || user.email}
                      </span>
                    </span>
                  }
                  id="user-nav-dropdown"
                  align="end"
                  menuVariant="dark"
                >
                  <NavDropdown.ItemText>
                    <div>
                      <div className="fw-semibold">{user.name || 'User'}</div>
                      <div className="text-muted small">{user?.email || ''}</div>
                    </div>
                  </NavDropdown.ItemText>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <span role="img" aria-label="logout">🚪</span> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <>
                  <LinkContainer to="/login">
                    <Nav.Link
                      active={location.pathname === '/login'}
                      style={{ color: '#fff', fontWeight: 500 }}
                    >
                      Login
                    </Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/signup">
                    <Nav.Link
                      active={location.pathname === '/signup'}
                      style={{
                        color: '#ffe066',
                        fontWeight: 600,
                        border: '1.5px solid #ffe066',
                        borderRadius: 20,
                        marginLeft: 12,
                        padding: '4px 18px',
                        background: 'rgba(255,224,102,0.08)',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#ffe066';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255,224,102,0.08)';
                        e.currentTarget.style.color = '#ffe066';
                      }}
                    >
                      Sign up
                    </Nav.Link>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}
