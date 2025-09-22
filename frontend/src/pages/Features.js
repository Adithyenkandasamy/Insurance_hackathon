import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Features = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">Powerful Features</h1>
              <p className="lead mb-4">
                Discover how InsuranceAI transforms the entire claims process with 
                cutting-edge artificial intelligence and machine learning.
              </p>
              {!user && (
                <Button as={Link} to="/register" size="lg" variant="light">
                  Start Free Trial
                </Button>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Main Features */}
      <section className="py-5">
        <Container>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-4">
                    <i className="bi bi-camera text-primary" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h4 className="fw-bold mb-3">AI Image Analysis</h4>
                  <p className="text-muted">
                    Advanced computer vision technology analyzes vehicle damage photos 
                    with 99.2% accuracy, identifying damage types, severity, and cost estimates.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-4">
                    <i className="bi bi-shield-exclamation text-danger" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Fraud Detection</h4>
                  <p className="text-muted">
                    Multi-layer fraud detection system using deep learning algorithms 
                    to identify suspicious patterns and prevent fraudulent claims.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-4">
                    <i className="bi bi-lightning-charge text-warning" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Instant Processing</h4>
                  <p className="text-muted">
                    Process claims in under 30 seconds instead of weeks. Our AI 
                    provides instant damage assessment and cost calculations.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-4">
                    <i className="bi bi-file-earmark-pdf text-info" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Automated Reports</h4>
                  <p className="text-muted">
                    Generate comprehensive PDF reports automatically with detailed 
                    analysis, recommendations, and supporting documentation.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-4">
                    <i className="bi bi-graph-up text-success" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Analytics Dashboard</h4>
                  <p className="text-muted">
                    Real-time analytics and insights into claim patterns, fraud trends, 
                    and processing efficiency with interactive dashboards.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="mb-4">
                    <i className="bi bi-people text-primary" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h4 className="fw-bold mb-3">Multi-User Support</h4>
                  <p className="text-muted">
                    Support for multiple user roles including claimants, adjusters, 
                    and administrators with customized workflows and permissions.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* AI Technology Deep Dive */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-5">
            <Col className="text-center">
              <h2 className="fw-bold mb-3">AI Technology Deep Dive</h2>
              <p className="lead text-muted">See how our advanced AI algorithms work</p>
            </Col>
          </Row>
          
          <Row className="align-items-center mb-5">
            <Col lg={6}>
              <h3 className="fw-bold mb-4">Computer Vision Analysis</h3>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>YOLOv8 Object Detection:</strong> Identifies vehicle parts and damage locations
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>Custom CNN Models:</strong> Classifies damage severity and type
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>Pixel-Level Analysis:</strong> Measures damage area and calculates costs
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>Multi-Angle Processing:</strong> Analyzes multiple photos for comprehensive assessment
                </li>
              </ul>
            </Col>
            <Col lg={6}>
              <Card className="bg-primary text-white">
                <Card.Body className="p-4">
                  <h5 className="mb-3">Accuracy Metrics</h5>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Damage Detection</span>
                      <span>99.2%</span>
                    </div>
                    <div className="progress" style={{height: '8px'}}>
                      <div className="progress-bar bg-light" style={{width: '99.2%'}}></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Cost Estimation</span>
                      <span>94.8%</span>
                    </div>
                    <div className="progress" style={{height: '8px'}}>
                      <div className="progress-bar bg-light" style={{width: '94.8%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Classification</span>
                      <span>97.1%</span>
                    </div>
                    <div className="progress" style={{height: '8px'}}>
                      <div className="progress-bar bg-light" style={{width: '97.1%'}}></div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="align-items-center">
            <Col lg={6} className="order-lg-2">
              <h3 className="fw-bold mb-4">Fraud Detection Engine</h3>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>Image Manipulation Detection:</strong> Identifies edited or tampered photos
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>Metadata Analysis:</strong> Examines EXIF data for inconsistencies
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>Pattern Recognition:</strong> Detects unusual damage patterns or staging
                </li>
                <li className="mb-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>Behavioral Analysis:</strong> Identifies suspicious claim submission patterns
                </li>
              </ul>
            </Col>
            <Col lg={6} className="order-lg-1">
              <Card className="bg-danger text-white">
                <Card.Body className="p-4">
                  <h5 className="mb-3">Fraud Prevention Stats</h5>
                  <Row className="text-center">
                    <Col xs={4}>
                      <h3 className="mb-1">95%</h3>
                      <small>Detection Rate</small>
                    </Col>
                    <Col xs={4}>
                      <h3 className="mb-1">$2.3M</h3>
                      <small>Saved Monthly</small>
                    </Col>
                    <Col xs={4}>
                      <h3 className="mb-1">&lt;1%</h3>
                      <small>False Positives</small>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Integration & API */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold mb-3">Easy Integration</h2>
              <p className="lead text-muted">Seamlessly integrate with your existing systems</p>
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col md={4}>
              <Card className="text-center p-4 h-100">
                <Card.Body>
                  <i className="bi bi-code-square text-primary mb-3" style={{fontSize: '2.5rem'}}></i>
                  <h5 className="fw-bold">REST API</h5>
                  <p className="text-muted">
                    Comprehensive RESTful API with detailed documentation for easy integration.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center p-4 h-100">
                <Card.Body>
                  <i className="bi bi-plugin text-success mb-3" style={{fontSize: '2.5rem'}}></i>
                  <h5 className="fw-bold">Webhooks</h5>
                  <p className="text-muted">
                    Real-time notifications and updates through secure webhook endpoints.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center p-4 h-100">
                <Card.Body>
                  <i className="bi bi-cloud-arrow-up text-info mb-3" style={{fontSize: '2.5rem'}}></i>
                  <h5 className="fw-bold">Cloud Deploy</h5>
                  <p className="text-muted">
                    One-click deployment to major cloud providers with auto-scaling.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Ready to Transform Your Claims Process?</h2>
              <p className="lead mb-4">
                Start processing claims 10x faster with 99% accuracy. Join thousands of companies already using InsuranceAI.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                {!user ? (
                  <>
                    <Button as={Link} to="/register" size="lg" variant="light">
                      Start Free Trial
                    </Button>
                    <Button as={Link} to="/contact" size="lg" variant="outline-light">
                      Contact Sales
                    </Button>
                  </>
                ) : (
                  <Button as={Link} to="/claim/new" size="lg" variant="light">
                    Submit New Claim
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Features;
