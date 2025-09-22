import React from 'react';
import { Navbar as BSNavbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" fixed="top" className="shadow">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold">
          <i className="bi bi-shield-fill me-2"></i>
          SecureGuard Insurance
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="navbar-link">
              <i className="bi bi-house-door me-1"></i>Home
            </Nav.Link>
            <Nav.Link as={Link} to="/features" className="navbar-link">
              <i className="bi bi-stars me-1"></i>Features
            </Nav.Link>
            <Nav.Link as={Link} to="/about" className="navbar-link">
              <i className="bi bi-info-circle me-1"></i>About
            </Nav.Link>
            <Nav.Link as={Link} to="/contact" className="navbar-link">
              <i className="bi bi-envelope me-1"></i>Contact
            </Nav.Link>
          </Nav>
          
          <Nav>
            {user ? (
              <NavDropdown 
                title={
                  <>
                    <i className="bi bi-person-circle me-1"></i>
                    {user.name}
                  </>
                } 
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/dashboard" className="dropdown-item-custom">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </NavDropdown.Item>
                {user.is_admin && (
                  <NavDropdown.Item as={Link} to="/admin" className="dropdown-item-custom">
                    <i className="bi bi-gear me-2"></i>
                    Admin Panel
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="dropdown-item-custom logout-item">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="navbar-link login-link">
                  <i className="bi bi-box-arrow-in-right me-1"></i>Login
                </Nav.Link>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="outline-light" 
                  size="sm" 
                  className="ms-2 signup-btn"
                >
                  <i className="bi bi-person-plus me-1"></i>Sign Up
                </Button>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
