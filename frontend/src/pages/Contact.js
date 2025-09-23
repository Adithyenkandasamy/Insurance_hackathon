import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }
    
    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous success state
    setSuccess(false);
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors below and try again.');
      return;
    }
    
    setLoading(true);
    setSuccess(false);

    try {
      const response = await axios.post('/api/contact/send', formData);

      if (response.status === 200) {
        setSuccess(true);
        setLoading(false);
        setErrors({});
        toast.success('Message sent successfully! We\'ll respond within 24 hours.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      setLoading(false);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleDirectEmail = () => {
    const mailtoUrl = 'mailto:adithyen1@gmail.com?subject=General Inquiry&body=Hello InsuranceAI Team,%0A%0A';
    window.location.href = mailtoUrl;
  };

  const handlePhoneCall = () => {
    window.location.href = 'tel:+911234567890';
  };


  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">Contact Us</h1>
              <p className="lead mb-4">
                Have questions about InsuranceAI? We're here to help you transform 
                your claims processing with AI technology.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Form & Info */}
      <section className="contact-section py-5">
        <Container>
          <Row className="contact-row g-4">
            <Col lg={8} className="contact-form-col">
              <Card className="shadow-sm contact-card">
                <Card.Header>
                  <h4 className="mb-0">Send us a Message</h4>
                </Card.Header>
                <Card.Body className="p-4">
                  {success && (
                    <Alert variant="success">
                      <i className="bi bi-check-circle me-2"></i>
                      Thank you for your message! We'll respond within 24 hours.
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your full name"
                            required
                            isInvalid={!!errors.name}
                            className={errors.name ? 'is-invalid' : ''}
                          />
                          {errors.name && (
                            <Form.Control.Feedback type="invalid">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {typeof errors.name === 'string' ? errors.name : errors.name.msg || 'Invalid input'}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your.email@example.com"
                            required
                            isInvalid={!!errors.email}
                            className={errors.email ? 'is-invalid' : ''}
                          />
                          {errors.email && (
                            <Form.Control.Feedback type="invalid">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {typeof errors.email === 'string' ? errors.email : errors.email.msg || 'Invalid input'}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Subject <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="demo">Request Demo</option>
                        <option value="pricing">Pricing Information</option>
                        <option value="technical">Technical Support</option>
                        <option value="partnership">Partnership Opportunity</option>
                        <option value="other">Other</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Message <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please provide details about your inquiry..."
                        required
                        isInvalid={!!errors.message}
                        className={errors.message ? 'is-invalid' : ''}
                      />
                      {errors.message && (
                        <Form.Control.Feedback type="invalid">
                          <i className="bi bi-exclamation-circle me-1"></i>
                          {typeof errors.message === 'string' ? errors.message : errors.message.msg || 'Invalid input'}
                        </Form.Control.Feedback>
                      )}
                      <Form.Text className="text-muted">
                        Character count: {formData.message.length} (minimum 10)
                      </Form.Text>
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button 
                        type="submit" 
                        variant="primary" 
                        size="lg"
                        disabled={loading}
                        className="contact-submit-btn"
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Opening Email Client...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-envelope-paper me-2"></i>
                            Send via Email Client
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => {
                          setFormData({ name: '', email: '', subject: '', message: '' });
                          setErrors({});
                          setSuccess(false);
                        }}
                        disabled={loading}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Reset Form
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} className="contact-info-col">
              <div className="mt-4 mt-lg-0 h-100 d-flex flex-column">
                {/* Contact Info */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Contact Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <h6><i className="bi bi-envelope text-primary me-2"></i>Email</h6>
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none contact-link"
                        onClick={handleDirectEmail}
                      >
                        <i className="bi bi-envelope-fill me-1"></i>
                        adithyen1@gmail.com
                      </Button>
                    </div>
                    <div className="mb-3">
                      <h6><i className="bi bi-telephone text-primary me-2"></i>Phone</h6>
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none contact-link"
                        onClick={handlePhoneCall}
                      >
                        <i className="bi bi-telephone-fill me-1"></i>
                        +91 12345 67890
                      </Button>
                    </div>
                    <div>
                      <h6><i className="bi bi-geo-alt text-primary me-2"></i>Address</h6>
                      <p className="text-muted mb-0">
                        SNS College of Technology<br />
                        Coimbatore, India
                      </p>
                    </div>
                  </Card.Body>
                </Card>

                {/* Business Hours */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Business Hours</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <strong>Monday - Friday:</strong><br />
                      <span className="text-muted">9:00 AM - 6:00 PM IST</span>
                    </div>
                    <div className="mb-2">
                      <strong>Saturday:</strong><br />
                      <span className="text-muted">10:00 AM - 4:00 PM IST</span>
                    </div>
                    <div>
                      <strong>Sunday:</strong><br />
                      <span className="text-muted">Closed</span>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

    </div>
  );
};

export default Contact;
