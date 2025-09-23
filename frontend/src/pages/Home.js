import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">
                SecureGuard Insurance
              </h1>
              <p className="display-6 mb-3 text-white-50 fw-semibold">
                Claims Processing Made Simple
              </p>
              <p className="lead mb-4">
                Experience faster, more accurate claim processing with our advanced 
                digital platform. Submit claims, track progress, and get results with confidence.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                {!user ? (
                  <>
                    <Button as={Link} to="/register" size="lg" variant="light">
                      Get Started Free
                    </Button>
                    <Button as={Link} to="/login" size="lg" variant="outline-light">
                      Sign In
                    </Button>
                  </>
                ) : (
                  <Button as={Link} to="/dashboard" size="lg" variant="light">
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold">Why Choose InsuranceAI?</h2>
              <p className="text-muted">Advanced technology meets insurance expertise</p>
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col md={4}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-3">
                    <i className="bi bi-lightning-charge text-warning" style={{fontSize: '3rem'}}></i>
                  </div>
                  <Card.Title>Lightning Fast</Card.Title>
                  <Card.Text>
                    Process claims in under 30 seconds with our advanced AI algorithms.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-3">
                    <i className="bi bi-shield-check text-success" style={{fontSize: '3rem'}}></i>
                  </div>
                  <Card.Title>Fraud Detection</Card.Title>
                  <Card.Text>
                    Advanced AI identifies fraudulent claims with 95% accuracy.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-3">
                    <i className="bi bi-camera text-primary" style={{fontSize: '3rem'}}></i>
                  </div>
                  <Card.Title>Image Analysis</Card.Title>
                  <Card.Text>
                    Precise damage assessment from photos using computer vision.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center">
            <Col md={3} className="mb-4">
              <h3 className="display-4 fw-bold text-primary">99.2%</h3>
              <p className="text-muted">Accuracy Rate</p>
            </Col>
            <Col md={3} className="mb-4">
              <h3 className="display-4 fw-bold text-success">10M+</h3>
              <p className="text-muted">Claims Processed</p>
            </Col>
            <Col md={3} className="mb-4">
              <h3 className="display-4 fw-bold text-warning">&lt; 30s</h3>
              <p className="text-muted">Processing Time</p>
            </Col>
            <Col md={3} className="mb-4">
              <h3 className="display-4 fw-bold text-info">95%</h3>
              <p className="text-muted">Fraud Detection</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Ready to Transform Your Claims Process?</h2>
              <p className="lead mb-4">
                Join thousands of insurance companies already using InsuranceAI to streamline their operations.
              </p>
              {!user && (
                <Button as={Link} to="/register" size="lg" variant="primary">
                  Start Free Trial
                </Button>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
