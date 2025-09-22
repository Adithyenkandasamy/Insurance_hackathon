import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await axios.get('/claims');
      setClaims(response.data);
    } catch (error) {
      toast.error('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      review: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (user?.is_admin) {
    // Redirect admin users to admin dashboard
    window.location.href = '/admin';
    return null;
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <div className="me-3">
              <i className="bi bi-person-circle text-insurance-primary" style={{fontSize: '3rem'}}></i>
            </div>
            <div>
              <h1 className="mb-1">Welcome back, {user?.name}</h1>
              <p className="text-muted mb-0">Your SecureGuard Insurance Dashboard</p>
            </div>
          </div>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col xs="auto">
          <Button as={Link} to="/claim/new" variant="primary">
            <i className="bi bi-plus-circle me-2"></i>
            New Claim
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-primary">{claims.length}</h3>
              <p className="text-muted mb-0">Total Claims</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-warning">
                {claims.filter(c => c.status === 'pending').length}
              </h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-success">
                {claims.filter(c => c.status === 'approved').length}
              </h3>
              <p className="text-muted mb-0">Approved</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-info">
                {formatCurrency(claims.reduce((sum, c) => sum + c.cost_estimate, 0))}
              </h3>
              <p className="text-muted mb-0">Total Estimates</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Claims Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Recent Claims</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-inbox text-muted" style={{fontSize: '3rem'}}></i>
              <h5 className="mt-3 text-muted">No claims yet</h5>
              <p className="text-muted">Start by creating your first claim</p>
              <Button as={Link} to="/claim/new" variant="primary">
                Create New Claim
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Policy #</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Estimate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.policy_number}</td>
                    <td>{new Date(claim.accident_date).toLocaleDateString()}</td>
                    <td>{claim.location}</td>
                    <td>{getStatusBadge(claim.status)}</td>
                    <td>{formatCurrency(claim.cost_estimate)}</td>
                    <td>
                      <Button 
                        as={Link} 
                        to={`/claim/${claim.id}`} 
                        size="sm" 
                        variant="outline-primary"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;
