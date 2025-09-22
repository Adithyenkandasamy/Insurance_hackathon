import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import axios from 'axios';
import { toast } from 'react-toastify';

const NewClaim = () => {
  const [formData, setFormData] = useState({
    policy_number: '',
    accident_date: '',
    location: '',
    description: ''
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const validateImages = () => {
    if (files.length === 0) {
      return 'Please upload at least one image';
    }

    // Check if all required image categories are present
    const requiredCategories = ['front', 'rear', 'back', 'top'];
    const uploadedCategories = [...new Set(files.map(file => file.category))];
    const missingCategories = requiredCategories.filter(cat => !uploadedCategories.includes(cat));
    
    if (missingCategories.length > 0) {
      return `Missing required vehicle images: ${missingCategories.map(cat => 
        cat.charAt(0).toUpperCase() + cat.slice(1)
      ).join(', ')}`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const imageError = validateImages();
    if (imageError) {
      setError(imageError);
      return;
    }

    setLoading(true);
    setError('');

    const formDataToSend = new FormData();
    formDataToSend.append('policy_number', formData.policy_number);
    formDataToSend.append('accident_date', formData.accident_date);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('description', formData.description);
    
    files.forEach((fileItem) => {
      formDataToSend.append('images', fileItem.file || fileItem);
    });

    try {
      const response = await axios.post('/claims', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Claim submitted successfully!');
      navigate(`/claim/${response.data.id}`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit claim';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Submit New Claim</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{typeof error === 'string' ? error : error.msg || error.detail || 'An error occurred'}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Policy Number *</Form.Label>
                      <Form.Control
                        type="text"
                        name="policy_number"
                        value={formData.policy_number}
                        onChange={handleChange}
                        placeholder="Enter policy number"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Accident Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="accident_date"
                        value={formData.accident_date}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter accident location"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what happened..."
                  />
                </Form.Group>

                {/* Enhanced Image Upload Component */}
                <Form.Group className="mb-4">
                  <Form.Label>Vehicle Damage Images *</Form.Label>
                  <p className="text-muted small mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Please upload at least one image for each view: <strong>Front, Rear, Back, and Top</strong> of the vehicle.
                  </p>
                  <ImageUpload
                    files={files}
                    setFiles={setFiles}
                    showPreview={true}
                    showAnalysis={true}
                    requireCategories={true}
                    maxFiles={12}
                    allowDownload={false}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-grow-1"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Submit Claim
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NewClaim;
