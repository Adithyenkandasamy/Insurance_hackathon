import React, { useState, useEffect } from 'react';
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
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  useEffect(() => {
    // Check for token in URL parameters (from Google OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const name = urlParams.get('name');
    const email = urlParams.get('email');
    
    if (token) {
      // Store token and set user data
      localStorage.setItem('access_token', token);
      setUser({ name, email });
      setFormData({ name, email, subject: '', message: '' });
      toast.success(`Welcome ${name}! You are now authenticated.`);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check if user is already authenticated
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await axios.get('http://localhost:8000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        setFormData({
          ...formData,
          name: response.data.name || '',
          email: response.data.email || ''
        });
      }
    } catch (error) {
      localStorage.removeItem('access_token');
      console.log('No valid authentication found');
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      // Redirect to backend Google OAuth
      window.location.href = 'http://localhost:8000/api/auth/google';
    } catch (error) {
      setIsAuthenticating(false);
      toast.error('Failed to initiate Google authentication');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setErrors({});
    setSuccess(false);
    toast.info('Logged out successfully.');
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
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Send us a Message</h4>
                  {user && (
                    <div className="d-flex align-items-center">
                      <img 
                        src={user.picture} 
                        alt={user.name}
                        className="rounded-circle me-2"
                        width="32"
                        height="32"
                      />
                      <span className="me-2 text-muted">{user.name}</span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right"></i>
                      </Button>
                    </div>
                  )}
                </Card.Header>
                <Card.Body className="p-4">
                  {!user ? (
                    <div className="text-center py-4">
                      <h5 className="mb-3">Please sign in with Google to send a message</h5>
                      <p className="text-muted mb-4">
                        We use Google authentication to ensure secure communication and prevent spam.
                      </p>
                      <div className="google-auth-container">
                        <Button
                          variant="outline-primary"
                          size="lg"
                          className="w-100 mb-3 google-auth-btn"
                          onClick={handleGoogleLogin}
                          disabled={isAuthenticating}
                        >
                          {isAuthenticating ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <svg className="me-2" width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              Continue with Google
                            </>
                          )}
                        </Button>
                      </div>
                      <small className="text-muted">
                        Your information is secure and will only be used for contact purposes.
                      </small>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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

                {/* Quick Links */}
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Quick Links</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="quick-action-btn"
                        onClick={() => window.open('#', '_blank')}
                      >
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        Download Brochure
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="quick-action-btn"
                        onClick={() => window.open('#', '_blank')}
                      >
                        <i className="bi bi-play-circle me-2"></i>
                        Watch Demo Video
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="quick-action-btn"
                        onClick={() => window.scrollTo({top: document.querySelector('.bg-light').offsetTop, behavior: 'smooth'})}
                      >
                        <i className="bi bi-question-circle me-2"></i>
                        View FAQ
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="quick-action-btn"
                        onClick={handleDirectEmail}
                      >
                        <i className="bi bi-envelope-plus me-2"></i>
                        Quick Email
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <h2 className="text-center fw-bold mb-5">Frequently Asked Questions</h2>
              
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                      How accurate is the AI damage assessment?
                    </button>
                  </h2>
                  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Our AI achieves 99.2% accuracy in damage detection and assessment, backed by extensive training on millions of claim images and continuous learning from real-world data.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                      How quickly can claims be processed?
                    </button>
                  </h2>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Most claims are processed in under 30 seconds, compared to traditional processing times of weeks or months. Complex cases may take a few minutes for thorough analysis.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                      Is my data secure with InsuranceAI?
                    </button>
                  </h2>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes, we use enterprise-grade security with end-to-end encryption, secure cloud infrastructure, and comply with all major data protection regulations including GDPR and CCPA.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                      Can InsuranceAI integrate with existing systems?
                    </button>
                  </h2>
                  <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Absolutely! Our platform offers comprehensive REST APIs, webhooks, and pre-built integrations for major insurance management systems. Our team provides full integration support.
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Contact;
