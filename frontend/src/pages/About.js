import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const About = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-3 fw-bold mb-4">About InsuranceAI</h1>
              <p className="lead fs-4 mb-4">
                Revolutionizing insurance with cutting-edge AI technology for faster, 
                more accurate, and fraud-resistant claim processing.
              </p>
              <Button as={Link} to="#mission" variant="light" size="lg" className="px-4 py-3 rounded-pill">
                <i className="bi bi-arrow-down me-2"></i>Discover More
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="py-5" id="mission">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="pe-lg-5">
              <h2 className="display-5 fw-bold mb-4 text-primary">Our Mission</h2>
              <p className="lead mb-4 fs-5">
                Transform insurance claim processing through artificial intelligence, 
                reducing processing time from weeks to seconds while maintaining the highest 
                standards of accuracy and fraud prevention.
              </p>
              <p className="fs-6 text-muted lh-lg">
                Founded by a team of AI researchers and insurance industry veterans, 
                InsuranceAI bridges the gap between cutting-edge technology and real-world 
                insurance needs. Our platform processes thousands of claims daily with 
                unprecedented accuracy, helping both insurance companies and customers save time and money.
              </p>
            </Col>
            <Col lg={6} className="ps-lg-4">
              <Row className="g-4">
                <Col xs={6}>
                  <Card className="text-center p-4 rounded-4 h-100">
                    <Card.Body>
                      <div className="display-4 fw-bold text-primary mb-2">99.2%</div>
                      <p className="mb-0 text-muted fw-medium">Accuracy Rate</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="text-center p-4 rounded-4 h-100">
                    <Card.Body>
                      <div className="display-4 fw-bold text-success mb-2">10M+</div>
                      <p className="mb-0 text-muted fw-medium">Claims Processed</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="text-center p-4 rounded-4 h-100">
                    <Card.Body>
                      <div className="display-4 fw-bold text-warning mb-2">&lt; 30s</div>
                      <p className="mb-0 text-muted fw-medium">Processing Time</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="text-center p-4 rounded-4 h-100">
                    <Card.Body>
                      <div className="display-4 fw-bold text-info mb-2">95%</div>
                      <p className="mb-0 text-muted fw-medium">Fraud Detection</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Technology Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row>
            <Col xs={12} className="text-center mb-5">
              <h2 className="display-5 fw-bold text-dark mb-3">Our Technology</h2>
              <p className="lead text-muted fs-5">Built with state-of-the-art AI and machine learning technologies</p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <Card className="text-center p-5 rounded-4 h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="mb-4">
                    <div className="bg-primary bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{width: '80px', height: '80px'}}>
                      <i className="bi bi-eye text-white" style={{fontSize: '2rem'}}></i>
                    </div>
                  </div>
                  <h4 className="fw-bold mb-3 text-dark">Computer Vision</h4>
                  <p className="text-muted lh-lg">
                    Advanced image recognition using YOLOv8 and custom CNN models 
                    to detect and classify vehicle damage with pixel-level accuracy.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="text-center p-5 rounded-4 h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="mb-4">
                    <div className="bg-success bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{width: '80px', height: '80px'}}>
                      <i className="bi bi-shield-check text-white" style={{fontSize: '2rem'}}></i>
                    </div>
                  </div>
                  <h4 className="fw-bold mb-3 text-dark">Fraud Detection</h4>
                  <p className="text-muted lh-lg">
                    Multi-layer fraud detection using deep learning, metadata analysis, 
                    and behavioral pattern recognition to prevent fraudulent claims.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="text-center p-5 rounded-4 h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="mb-4">
                    <div className="bg-info bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{width: '80px', height: '80px'}}>
                      <i className="bi bi-cloud text-white" style={{fontSize: '2rem'}}></i>
                    </div>
                  </div>
                  <h4 className="fw-bold mb-3 text-dark">Cloud Infrastructure</h4>
                  <p className="text-muted lh-lg">
                    Scalable cloud architecture with auto-scaling capabilities, 
                    ensuring 99.9% uptime and lightning-fast processing speeds.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Team Section */}
      <section className="py-5">
        <Container>
          <Row>
            <Col xs={12} className="text-center mb-5">
              <h2 className="fw-bold">Meet Our Team</h2>
              <p className="text-muted">The brilliant minds behind InsuranceAI</p>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col lg={4} md={6} className="mb-4">
              <Card className="text-center border-0 h-100">
                <Card.Body>
                  <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '80px', height: '80px', fontSize: '1.5rem'}}>
                    AI
                  </div>
                  <h5 className="card-title">Dayanithi.M</h5>
                  <p className="text-muted">Data Science Developer</p>
                  <p className="card-text">
                    he is the guy who found the datasets and models.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="text-center border-0 h-100">
                <Card.Body>
                  <div className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '80px', height: '80px', fontSize: '1.5rem'}}>
                    Ui/Ux
                  </div>
                  <h5 className="card-title">Ashwadhda.C</h5>
                  <p className="text-muted">UI/UX</p>
                  <p className="card-text">
                   She Done the Ui/Ux in the figma.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="text-center border-0 h-100">
                <Card.Body>
                  <div className="rounded-circle bg-warning text-dark d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '80px', height: '80px', fontSize: '1.5rem'}}>
                    WF
                  </div>
                  <h5 className="card-title">Nisha</h5>
                  <p className="text-muted"></p>
                  <p className="card-text">
                    She developed the wire frame and other functionalities.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Join Us in Revolutionizing Insurance</h2>
              <p className="lead mb-4">
                Whether you're an insurance company looking to modernize your claims process 
                or a customer seeking faster, fairer claim resolution, we're here to help.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                {!user && (
                  <Button as={Link} to="/register" size="lg" variant="primary">
                    <i className="bi bi-person-plus me-2"></i>Get Started Today
                  </Button>
                )}
                <Button as={Link} to="/contact" size="lg" variant="outline-primary">
                  <i className="bi bi-envelope me-2"></i>Contact Our Team
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About;
