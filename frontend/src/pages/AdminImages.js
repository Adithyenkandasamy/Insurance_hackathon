import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Image, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const AdminImages = () => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAngle, setFilterAngle] = useState('all');

  useEffect(() => {
    if (!user?.is_admin) {
      toast.error('Admin access required');
      return;
    }
    fetchImages();
  }, [user]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/admin/images', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImages(response.data);
    } catch (error) {
      toast.error('Failed to fetch images');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = async (imageId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/admin/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedImage(response.data);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to fetch image details');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/admin/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Image deleted successfully');
      fetchImages(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'warning', text: 'Pending' },
      'approved': { bg: 'success', text: 'Approved' },
      'rejected': { bg: 'danger', text: 'Rejected' },
      'review': { bg: 'info', text: 'Under Review' }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const getAngleBadge = (angle) => {
    const angleConfig = {
      'front': { bg: 'primary', icon: 'bi-car-front' },
      'rear': { bg: 'success', icon: 'bi-car-front-fill' },
      'back': { bg: 'warning', icon: 'bi-arrow-left-circle' },
      'top': { bg: 'info', icon: 'bi-circle' }
    };
    const config = angleConfig[angle] || { bg: 'secondary', icon: 'bi-image' };
    return (
      <Badge bg={config.bg}>
        <i className={`${config.icon} me-1`}></i>
        {angle ? angle.charAt(0).toUpperCase() + angle.slice(1) : 'Unknown'}
      </Badge>
    );
  };

  const filteredImages = images.filter(image => {
    const statusMatch = filterStatus === 'all' || image.claim_status === filterStatus;
    const angleMatch = filterAngle === 'all' || image.angle === filterAngle;
    return statusMatch && angleMatch;
  });

  if (!user?.is_admin) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h4>Access Denied</h4>
          <p>You need administrator privileges to access this page.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h4 className="mb-0">
                    <i className="bi bi-images me-2"></i>
                    Admin Image Management
                  </h4>
                </Col>
                <Col xs="auto">
                  <Button variant="outline-primary" onClick={fetchImages} disabled={loading}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            
            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Filter by Claim Status</Form.Label>
                    <Form.Select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="review">Under Review</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Filter by Image Angle</Form.Label>
                    <Form.Select 
                      value={filterAngle} 
                      onChange={(e) => setFilterAngle(e.target.value)}
                    >
                      <option value="all">All Angles</option>
                      <option value="front">Front View</option>
                      <option value="rear">Rear View</option>
                      <option value="back">Back View</option>
                      <option value="top">Top View</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading images...</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <Badge bg="info" className="me-2">
                      Total Images: {filteredImages.length}
                    </Badge>
                    {filterStatus !== 'all' && (
                      <Badge bg="secondary" className="me-2">
                        Filtered by: {filterStatus}
                      </Badge>
                    )}
                    {filterAngle !== 'all' && (
                      <Badge bg="secondary">
                        Angle: {filterAngle}
                      </Badge>
                    )}
                  </div>

                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Preview</th>
                          <th>Claim</th>
                          <th>User</th>
                          <th>Angle</th>
                          <th>Status</th>
                          <th>AI Analysis</th>
                          <th>Uploaded</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredImages.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="text-center py-4 text-muted">
                              No images found matching the current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredImages.map(image => (
                            <tr key={image.id}>
                              <td>#{image.id}</td>
                              <td>
                                <Image
                                  src={`/static/${image.image_path}`}
                                  thumbnail
                                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                  onClick={() => handleViewImage(image.id)}
                                  className="cursor-pointer"
                                />
                              </td>
                              <td>
                                <div>
                                  <strong>#{image.claim_id}</strong>
                                  <br />
                                  <small className="text-muted">{image.claim_policy}</small>
                                </div>
                              </td>
                              <td>
                                <div>
                                  {image.user_name}
                                  <br />
                                  <small className="text-muted">{image.user_email}</small>
                                </div>
                              </td>
                              <td>{getAngleBadge(image.angle)}</td>
                              <td>{getStatusBadge(image.claim_status)}</td>
                              <td>
                                {image.ai_analysis ? (
                                  <Badge bg="success">
                                    <i className="bi bi-robot me-1"></i>
                                    Analyzed
                                  </Badge>
                                ) : (
                                  <Badge bg="secondary">
                                    <i className="bi bi-hourglass me-1"></i>
                                    Pending
                                  </Badge>
                                )}
                              </td>
                              <td>
                                <small>
                                  {new Date(image.uploaded_at).toLocaleDateString()}
                                  <br />
                                  {new Date(image.uploaded_at).toLocaleTimeString()}
                                </small>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleViewImage(image.id)}
                                    title="View Details"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Image Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-image me-2"></i>
            Image Details #{selectedImage?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedImage && (
            <Row>
              <Col md={8}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Image Preview</h6>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <Image
                      src={`/static/${selectedImage.image_path}`}
                      fluid
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </Card.Body>
                </Card>

                {selectedImage.ai_analysis && (
                  <Card className="mt-3">
                    <Card.Header>
                      <h6 className="mb-0">
                        <i className="bi bi-robot me-2"></i>
                        AI Analysis Results
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <pre className="bg-light p-3 rounded">
                        {JSON.stringify(selectedImage.ai_analysis, null, 2)}
                      </pre>
                    </Card.Body>
                  </Card>
                )}
              </Col>

              <Col md={4}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Image Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>ID:</strong> #{selectedImage.id}</p>
                    <p><strong>Hash:</strong> <br />
                      <small className="text-muted font-monospace">
                        {selectedImage.image_hash}
                      </small>
                    </p>
                    <p><strong>Angle:</strong> {getAngleBadge(selectedImage.angle)}</p>
                    <p><strong>Uploaded:</strong> <br />
                      {new Date(selectedImage.uploaded_at).toLocaleString()}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="mt-3">
                  <Card.Header>
                    <h6 className="mb-0">Claim Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>Claim ID:</strong> #{selectedImage.claim.id}</p>
                    <p><strong>Policy:</strong> {selectedImage.claim.policy_number}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedImage.claim.status)}</p>
                    <p><strong>Date:</strong> {selectedImage.claim.accident_date}</p>
                    <p><strong>Location:</strong> {selectedImage.claim.location}</p>
                    <p><strong>Damage Score:</strong> {selectedImage.claim.damage_score}%</p>
                    <p><strong>Fraud Score:</strong> {selectedImage.claim.fraud_score}%</p>
                  </Card.Body>
                </Card>

                <Card className="mt-3">
                  <Card.Header>
                    <h6 className="mb-0">User Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>Name:</strong> {selectedImage.claim.user.name}</p>
                    <p><strong>Email:</strong> {selectedImage.claim.user.email}</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        .font-monospace {
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </Container>
  );
};

export default AdminImages;
