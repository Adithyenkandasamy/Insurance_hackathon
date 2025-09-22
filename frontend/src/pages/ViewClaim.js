import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Alert, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import ReportGenerator from '../components/ReportGenerator';
import axios from 'axios';
import { toast } from 'react-toastify';

const ViewClaim = () => {
  const { id } = useParams();
  // const { user } = useAuth(); // Commented out as not used
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimImages, setClaimImages] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClaim();
  }, [id]);

  const fetchClaim = useCallback(async () => {
    try {
      const response = await axios.get(`/claims/${id}`);
      setClaim(response.data);
      // Set claim images for the ImageUpload component
      if (response.data.images) {
        setClaimImages(response.data.images);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Claim not found');
        navigate('/dashboard');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
        navigate('/dashboard');
      } else {
        toast.error('Failed to fetch claim details');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

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


  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!claim) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Claim not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold">Claim #{claim.id}</h2>
              <p className="text-muted mb-0">Policy: {claim.policy_number}</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => setShowReportModal(true)}>
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Generate Report
              </Button>
              <ReportGenerator claim={claim} />
              <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                <i className="bi bi-arrow-left me-2"></i>
                Back
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Claim Details */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Claim Details</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>{getStatusBadge(claim.status)}</td>
                      </tr>
                      <tr>
                        <td><strong>Accident Date:</strong></td>
                        <td>{new Date(claim.accident_date).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td><strong>Location:</strong></td>
                        <td>{claim.location}</td>
                      </tr>
                      <tr>
                        <td><strong>Submitted:</strong></td>
                        <td>{new Date(claim.created_at).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td><strong>Damage Score:</strong></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <ProgressBar 
                              now={claim.damage_score * 100} 
                              className="me-2 flex-grow-1"
                              variant={claim.damage_score > 0.7 ? 'danger' : claim.damage_score > 0.4 ? 'warning' : 'success'}
                              style={{height: '8px'}}
                            />
                            <span>{(claim.damage_score * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Cost Estimate:</strong></td>
                        <td>{formatCurrency(claim.cost_estimate)}</td>
                      </tr>
                      <tr>
                        <td><strong>Fraud Risk:</strong></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <ProgressBar 
                              now={claim.fraud_score * 100} 
                              className="me-2 flex-grow-1"
                              variant={claim.fraud_score > 0.7 ? 'danger' : claim.fraud_score > 0.4 ? 'warning' : 'success'}
                              style={{height: '8px'}}
                            />
                            {getRiskBadge(claim.fraud_score)}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Last Updated:</strong></td>
                        <td>{new Date(claim.updated_at).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
              
              {claim.description && (
                <div className="mt-3">
                  <h6>Description</h6>
                  <p className="text-muted">{claim.description}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* AI Analysis */}
          {claim.ai_analysis && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-robot me-2"></i>
                  AI Analysis Results
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <h6 className="text-primary">
                          <i className="bi bi-wrench me-2"></i>
                          Damage Analysis
                        </h6>
                        {claim.ai_analysis.damage_analysis && (
                          <div>
                            <div className="mb-3">
                              <strong>Severity:</strong>
                              <Badge 
                                bg={claim.ai_analysis.damage_analysis.severity === 'severe' ? 'danger' : 
                                    claim.ai_analysis.damage_analysis.severity === 'moderate' ? 'warning' : 'success'}
                                className="ms-2"
                              >
                                {claim.ai_analysis.damage_analysis.severity}
                              </Badge>
                            </div>
                            <div className="mb-3">
                              <strong>Confidence:</strong>
                              <div className="d-flex align-items-center mt-1">
                                <ProgressBar 
                                  now={claim.ai_analysis.damage_analysis.confidence * 100} 
                                  className="me-2 flex-grow-1"
                                  variant="info"
                                  style={{height: '10px'}}
                                />
                                <span>{(claim.ai_analysis.damage_analysis.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            {claim.ai_analysis.damage_analysis.detected_damages && (
                              <div>
                                <strong>Detected Issues:</strong>
                                <div className="mt-2">
                                  {claim.ai_analysis.damage_analysis.detected_damages.map((damage, index) => (
                                    <Badge key={index} bg="warning" className="me-1 mb-1">
                                      {damage}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {claim.ai_analysis.damage_analysis.recommendations && (
                              <div className="mt-3">
                                <strong>Recommendations:</strong>
                                <ul className="mt-2 small">
                                  {claim.ai_analysis.damage_analysis.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <h6 className="text-danger">
                          <i className="bi bi-shield-exclamation me-2"></i>
                          Fraud Analysis
                        </h6>
                        {claim.ai_analysis.fraud_analysis && (
                          <div>
                            <div className="mb-3">
                              <strong>Risk Level:</strong>
                              <Badge 
                                bg={claim.ai_analysis.fraud_analysis.risk_level === 'high' ? 'danger' : 
                                    claim.ai_analysis.fraud_analysis.risk_level === 'medium' ? 'warning' : 'success'}
                                className="ms-2"
                              >
                                {claim.ai_analysis.fraud_analysis.risk_level}
                              </Badge>
                            </div>
                            <div className="mb-3">
                              <strong>Fraud Score:</strong>
                              <div className="d-flex align-items-center mt-1">
                                <ProgressBar 
                                  now={claim.fraud_score * 100} 
                                  className="me-2 flex-grow-1"
                                  variant={claim.fraud_score > 0.7 ? 'danger' : claim.fraud_score > 0.4 ? 'warning' : 'success'}
                                  style={{height: '10px'}}
                                />
                                <span>{(claim.fraud_score * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="mb-3">
                              <strong>Suspicious Activity:</strong>
                              {claim.ai_analysis.fraud_analysis.is_suspicious ? (
                                <Badge bg="danger" className="ms-2">
                                  <i className="bi bi-exclamation-triangle me-1"></i>
                                  Yes
                                </Badge>
                              ) : (
                                <Badge bg="success" className="ms-2">
                                  <i className="bi bi-check-circle me-1"></i>
                                  No
                                </Badge>
                              )}
                            </div>
                            {claim.ai_analysis.fraud_analysis.detected_issues && claim.ai_analysis.fraud_analysis.detected_issues.length > 0 && (
                              <div>
                                <strong>Issues Found:</strong>
                                <div className="mt-2">
                                  {claim.ai_analysis.fraud_analysis.detected_issues.map((issue, index) => (
                                    <Badge key={index} bg="danger" className="me-1 mb-1">
                                      {issue}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {claim.ai_analysis.fraud_analysis.recommendations && (
                              <div className="mt-3">
                                <strong>Recommendations:</strong>
                                <ul className="mt-2 small">
                                  {claim.ai_analysis.fraud_analysis.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Claim Images - Read Only */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-images me-2"></i>
                Submitted Evidence ({claimImages.length} files)
              </h5>
            </Card.Header>
            <Card.Body>
              {claimImages.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-images" style={{fontSize: '2rem', opacity: 0.3}}></i>
                  <p className="mt-2 mb-0">No images submitted with this claim.</p>
                </div>
              ) : (
                <Row>
                  {claimImages.map((image, index) => (
                    <Col md={4} lg={3} className="mb-3" key={index}>
                      <Card className="h-100 border-0 shadow-sm">
                        <div className="position-relative">
                          <img 
                            src={`/static/${image.image_path}`}
                            className="card-img-top"
                            style={{ 
                              height: '150px', 
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }}
                            alt={`Evidence ${index + 1}`}
                            onClick={() => window.open(`/static/${image.image_path}`, '_blank')}
                          />
                          {image.angle && (
                            <Badge 
                              bg="primary"
                              className="position-absolute top-0 start-0 m-2"
                            >
                              {image.angle.charAt(0).toUpperCase() + image.angle.slice(1)} View
                            </Badge>
                          )}
                          {image.ai_analysis && (
                            <Badge 
                              bg="success"
                              className="position-absolute top-0 end-0 m-2"
                            >
                              <i className="bi bi-robot"></i> Analyzed
                            </Badge>
                          )}
                        </div>
                        <Card.Body className="p-2">
                          <div className="small text-muted">
                            Uploaded: {new Date(image.uploaded_at).toLocaleDateString()}
                          </div>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="w-100 mt-2"
                            onClick={() => window.open(`/static/${image.image_path}`, '_blank')}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View Full Size
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
              <Alert variant="info" className="mt-3 mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> Images cannot be modified after claim submission for security and audit purposes.
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="h2 text-primary">{formatCurrency(claim.cost_estimate)}</div>
                <div className="text-muted">Estimated Cost</div>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-2">
                <span>Damage Level:</span>
                <span className="fw-bold">{(claim.damage_score * 100).toFixed(0)}%</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Fraud Risk:</span>
                <span className="fw-bold">{(claim.fraud_score * 100).toFixed(0)}%</span>
              </div>
              
              <div className="d-flex justify-content-between">
                <span>Status:</span>
                <span>{getStatusBadge(claim.status)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Report Generator Modal */}
      <ReportGenerator 
        claim={claim}
        showModal={showReportModal}
        onHide={() => setShowReportModal(false)}
      />
    </Container>
  );
};

export default ViewClaim;
