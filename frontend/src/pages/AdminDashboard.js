import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, InputGroup, Dropdown, ButtonGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  // const { user } = useAuth(); // Commented out as not used
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [claimsResponse, statsResponse] = await Promise.all([
        axios.get('/claims'),
        axios.get('/admin/stats')
      ]);
      setClaims(claimsResponse.data);
      setFilteredClaims(claimsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter claims based on search term, status, and risk level
  useEffect(() => {
    let filtered = claims;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim => 
        claim.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'high') {
        filtered = filtered.filter(claim => claim.fraud_score > 0.7);
      } else if (riskFilter === 'medium') {
        filtered = filtered.filter(claim => claim.fraud_score > 0.4 && claim.fraud_score <= 0.7);
      } else if (riskFilter === 'low') {
        filtered = filtered.filter(claim => claim.fraud_score <= 0.4);
      }
    }

    setFilteredClaims(filtered);
  }, [claims, searchTerm, statusFilter, riskFilter]);

  const handleStatusUpdate = async () => {
    try {
      await axios.put(`/admin/claims/${selectedClaim.id}/status`, {
        status: newStatus
      });
      
      toast.success('Claim status updated successfully');
      setShowModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update claim status');
    }
  };

  const handleBulkAction = async () => {
    if (selectedClaims.length === 0 || !bulkAction) return;

    try {
      const promises = selectedClaims.map(claimId => 
        axios.put(`/admin/claims/${claimId}/status`, { status: bulkAction })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedClaims.length} claims updated to ${bulkAction}`);
      setSelectedClaims([]);
      setShowBulkModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update claims');
    }
  };

  const toggleClaimSelection = (claimId) => {
    setSelectedClaims(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClaims.length === filteredClaims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(filteredClaims.map(claim => claim.id));
    }
  };

  const openStatusModal = (claim) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status);
    setShowModal(true);
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

  const getRiskBadge = (score) => {
    if (score > 0.7) return <Badge bg="danger">High Risk</Badge>;
    if (score > 0.4) return <Badge bg="warning">Medium Risk</Badge>;
    return <Badge bg="success">Low Risk</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">Admin Dashboard</h2>
          <p className="text-muted">Manage all insurance claims</p>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Row className="mb-4">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={2}>
          <Form.Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="review">Under Review</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select 
            value={riskFilter} 
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </Form.Select>
        </Col>
        <Col md={4} className="text-end">
          {selectedClaims.length > 0 && (
            <ButtonGroup>
              <Button 
                variant="outline-primary"
                onClick={() => setShowBulkModal(true)}
              >
                <i className="bi bi-gear me-2"></i>
                Bulk Action ({selectedClaims.length})
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => setSelectedClaims([])}
              >
                Clear
              </Button>
            </ButtonGroup>
          )}
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={4} lg={2} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-primary">{stats.total_claims || 0}</h4>
              <p className="text-muted mb-0 small">Total Claims</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} lg={2} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-warning">{stats.pending_claims || 0}</h4>
              <p className="text-muted mb-0 small">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} lg={2} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-success">{stats.approved_claims || 0}</h4>
              <p className="text-muted mb-0 small">Approved</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} lg={2} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-danger">{stats.rejected_claims || 0}</h4>
              <p className="text-muted mb-0 small">Rejected</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} lg={2} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-info">{stats.review_claims || 0}</h4>
              <p className="text-muted mb-0 small">Under Review</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} lg={2} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-danger">{stats.high_risk_claims || 0}</h4>
              <p className="text-muted mb-0 small">High Risk</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Claims Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">All Claims</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>
                    <Form.Check 
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
                    />
                  </th>
                  <th>ID</th>
                  <th>Policy #</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Fraud Risk</th>
                  <th>Estimate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <Form.Check 
                        type="checkbox"
                        checked={selectedClaims.includes(claim.id)}
                        onChange={() => toggleClaimSelection(claim.id)}
                      />
                    </td>
                    <td>#{claim.id}</td>
                    <td>{claim.policy_number}</td>
                    <td>{new Date(claim.accident_date).toLocaleDateString()}</td>
                    <td>{claim.location}</td>
                    <td>{getStatusBadge(claim.status)}</td>
                    <td>{getRiskBadge(claim.fraud_score)}</td>
                    <td>{formatCurrency(claim.cost_estimate)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          as={Link} 
                          to={`/claim/${claim.id}`} 
                          size="sm" 
                          variant="outline-primary"
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={() => openStatusModal(claim)}
                        >
                          Update
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Status Update Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Claim Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Update status for claim #{selectedClaim?.id}</p>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="review">Under Review</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStatusUpdate}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Apply action to {selectedClaims.length} selected claims</p>
          <Form.Group>
            <Form.Label>Action</Form.Label>
            <Form.Select 
              value={bulkAction} 
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <option value="">Select action...</option>
              <option value="pending">Set to Pending</option>
              <option value="approved">Approve All</option>
              <option value="rejected">Reject All</option>
              <option value="review">Mark for Review</option>
            </Form.Select>
          </Form.Group>
          <div className="mt-3">
            <small className="text-muted">
              Selected Claims: {selectedClaims.join(', ')}
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleBulkAction}
            disabled={!bulkAction}
          >
            Apply to {selectedClaims.length} Claims
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
