import React, { useState } from 'react';
import { Card, Button, Row, Col, Table, Badge, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const ReportGenerator = ({ claim, showModal = false, onHide = () => {} }) => {
  const [generating, setGenerating] = useState(false);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);

  const generateReport = async () => {
    if (!claim) return;

    setGenerating(true);
    try {
      const response = await axios.get(`/claims/${claim.id}/report`, {
        responseType: 'blob',
        params: {
          format: reportFormat,
          include_images: includeImages,
          include_analysis: includeAnalysis
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `claim_report_${claim.id}.${reportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
      onHide();
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadClaimData = async () => {
    if (!claim) return;

    try {
      const claimData = {
        claim_details: {
          id: claim.id,
          policy_number: claim.policy_number,
          accident_date: claim.accident_date,
          location: claim.location,
          description: claim.description,
          status: claim.status,
          created_at: claim.created_at,
          updated_at: claim.updated_at
        },
        assessment: {
          damage_score: claim.damage_score,
          cost_estimate: claim.cost_estimate,
          fraud_score: claim.fraud_score
        },
        ai_analysis: claim.ai_analysis || {},
        images: claim.images || []
      };

      const dataStr = JSON.stringify(claimData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `claim_${claim.id}_data.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Claim data exported successfully');
    } catch (error) {
      toast.error('Failed to export claim data');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      review: 'info'
    };
    return colors[status] || 'secondary';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!showModal) {
    return (
      <div className="d-flex gap-2">
        <Button 
          variant="outline-primary" 
          onClick={() => generateReport()}
          disabled={!claim}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Download PDF
        </Button>
        <Button 
          variant="outline-secondary" 
          onClick={downloadClaimData}
          disabled={!claim}
        >
          <i className="bi bi-file-earmark-code me-2"></i>
          Export Data
        </Button>
      </div>
    );
  }

  return (
    <Modal show={showModal} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Generate Report - Claim #{claim?.id}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {claim && (
          <Row>
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h6 className="mb-0">Report Options</h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select 
                      value={reportFormat} 
                      onChange={(e) => setReportFormat(e.target.value)}
                    >
                      <option value="pdf">PDF Report</option>
                      <option value="docx">Word Document</option>
                      <option value="html">HTML Report</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      id="includeImages"
                      label="Include Images"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      id="includeAnalysis"
                      label="Include AI Analysis"
                      checked={includeAnalysis}
                      onChange={(e) => setIncludeAnalysis(e.target.checked)}
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      onClick={generateReport}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-download me-2"></i>
                          Generate {reportFormat.toUpperCase()} Report
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={downloadClaimData}
                    >
                      <i className="bi bi-file-earmark-code me-2"></i>
                      Export Raw Data (JSON)
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h6 className="mb-0">Report Preview</h6>
                </Card.Header>
                <Card.Body>
                  <div className="report-preview">
                    <h6 className="text-primary mb-3">
                      Insurance Claim Report #{claim.id}
                    </h6>
                    
                    <Table size="sm" borderless>
                      <tbody>
                        <tr>
                          <td><strong>Policy Number:</strong></td>
                          <td>{claim.policy_number}</td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>
                            <Badge bg={getStatusColor(claim.status)}>
                              {claim.status}
                            </Badge>
                          </td>
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
                          <td><strong>Cost Estimate:</strong></td>
                          <td className="fw-bold text-success">
                            {formatCurrency(claim.cost_estimate)}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Damage Score:</strong></td>
                          <td>{(claim.damage_score * 100).toFixed(1)}%</td>
                        </tr>
                        <tr>
                          <td><strong>Fraud Risk:</strong></td>
                          <td>
                            <Badge bg={claim.fraud_score > 0.7 ? 'danger' : claim.fraud_score > 0.4 ? 'warning' : 'success'}>
                              {claim.fraud_score > 0.7 ? 'High' : claim.fraud_score > 0.4 ? 'Medium' : 'Low'}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </Table>

                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Report will include: Claim details, assessment results
                        {includeImages && ', images'}
                        {includeAnalysis && ', AI analysis'}
                      </small>
                    </div>

                    {claim.ai_analysis && includeAnalysis && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small>
                          <strong>AI Analysis Summary:</strong><br/>
                          {claim.ai_analysis.damage_analysis && (
                            <>
                              Damage Severity: <Badge bg="info" className="me-1">
                                {claim.ai_analysis.damage_analysis.severity}
                              </Badge>
                            </>
                          )}
                          {claim.ai_analysis.fraud_analysis && (
                            <>
                              Risk Level: <Badge bg={claim.ai_analysis.fraud_analysis.risk_level === 'high' ? 'danger' : 'success'}>
                                {claim.ai_analysis.fraud_analysis.risk_level}
                              </Badge>
                            </>
                          )}
                        </small>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button 
          variant="primary" 
          onClick={generateReport}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Download Report'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportGenerator;
