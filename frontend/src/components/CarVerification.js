import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ProgressBar, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaCheckCircle, FaUpload, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const ANGLES = [
  { id: 'front', label: 'Front View', description: 'Front view of the vehicle showing the license plate' },
  { id: 'back', label: 'Rear View', description: 'Rear view showing the back of the vehicle' },
  { id: 'left', label: 'Left Side', description: 'Left side view of the vehicle' },
  { id: 'right', label: 'Right Side', description: 'Right side view of the vehicle' }
];

const CarVerification = ({ claimId, isAdmin = false }) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeAngle, setActiveAngle] = useState(null);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/car-verification/status/${claimId}`);
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setIsLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  const handleFileUpload = async (angle, file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsUploading(true);
      await axios.post(
        `/api/car-verification/upload/${claimId}?angle=${angle}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      toast.success(`${angle} image uploaded successfully`);
      fetchVerificationStatus();
    } catch (error) {
      console.error(`Error uploading ${angle} image:`, error);
      toast.error(`Failed to upload ${angle} image: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
      setActiveAngle(null);
    }
  };

  const getStatusVariant = (score) => {
    if (score >= 0.7) return 'success';
    if (score >= 0.4) return 'warning';
    return 'danger';
  };


  if (isLoading) {
    return (
      <Card className="mb-4">
        <Card.Header>Car Verification</Card.Header>
        <Card.Body className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 mb-0">Loading verification status...</p>
        </Card.Body>
      </Card>
    );
  }

  const overallProgress = verificationStatus 
    ? Math.round((verificationStatus.verified_angles / verificationStatus.total_angles) * 100) 
    : 0;

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Car Verification</strong>
          <span className="ms-2">
            <Badge bg={overallProgress === 100 ? 'success' : 'warning'}>
              {overallProgress}% Complete
            </Badge>
          </span>
        </div>
        {verificationStatus?.status === 'complete' && (
          <Badge bg="success" className="px-3 py-2">
            <FaCheckCircle className="me-1" /> Verification Complete
          </Badge>
        )}
      </Card.Header>
      
      <Card.Body>
        <Alert variant="info" className="d-flex align-items-center">
          <FaInfoCircle className="me-2" />
          <div>
            <strong>Verification Instructions:</strong> Please upload clear photos of your vehicle from all four angles.
            The system will verify that all images are of the same vehicle.
            {verificationStatus?.threshold && (
              <span> Minimum similarity score: <strong>{verificationStatus.threshold * 100}%</strong></span>
            )}
          </div>
        </Alert>

        <ProgressBar 
          now={overallProgress} 
          variant={getStatusVariant(overallProgress / 100)}
          className="mb-4" 
          style={{ height: '10px' }}
          label={`${overallProgress}%`}
        />

        <Row className="g-4">
          {ANGLES.map(({ id, label, description }) => {
            const angleData = verificationStatus?.angles?.[id] || {};
            const isVerified = angleData.verified;
            const score = angleData.score || 0;
            const scorePercent = Math.round(score * 100);
            
            return (
              <Col key={id} md={6} lg={3}>
                <Card className={`h-100 ${isVerified ? 'border-success' : 'border-light'}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">{label}</h6>
                      {angleData.uploaded ? (
                        <Badge bg={isVerified ? 'success' : 'warning'}>
                          {isVerified ? 'Verified' : 'Pending Review'}
                        </Badge>
                      ) : (
                        <Badge bg="secondary">Not Uploaded</Badge>
                      )}
                    </div>
                    
                    {angleData.uploaded ? (
                      <>
                        <div className="d-flex align-items-center mb-2">
                          <small className="text-muted me-2">Similarity Score:</small>
                          <ProgressBar 
                            now={scorePercent} 
                            variant={getStatusVariant(score)}
                            style={{ width: '60px', height: '6px' }}
                            className="flex-grow-1"
                          />
                          <small className="ms-2 fw-bold">{scorePercent}%</small>
                        </div>
                        
                        {angleData.uploaded_at && (
                          <small className="text-muted d-block mb-2">
                            Uploaded: {new Date(angleData.uploaded_at).toLocaleString()}
                          </small>
                        )}
                        
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="w-100"
                          onClick={() => document.getElementById(`file-${id}`)?.click()}
                          disabled={isUploading}
                        >
                          {isUploading && activeAngle === id ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          ) : (
                            <FaUpload className="me-2" />
                          )}
                          Update Image
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-3">
                        <Button 
                          variant="outline-primary" 
                          onClick={() => document.getElementById(`file-${id}`)?.click()}
                          disabled={isUploading}
                        >
                          <FaUpload className="me-2" />
                          Upload {label}
                        </Button>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      id={`file-${id}`}
                      accept="image/*"
                      className="d-none"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setActiveAngle(id);
                          handleFileUpload(id, e.target.files[0]);
                        }
                        e.target.value = null; // Reset input
                      }}
                      capture="environment"
                    />
                    
                    <small className="text-muted d-block mt-2">
                      <FaInfoCircle className="me-1" /> {description}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
        
        {verificationStatus?.status === 'complete' && (
          <Alert variant="success" className="mt-4">
            <div className="d-flex align-items-center">
              <FaCheckCircle className="me-2" size={20} />
              <div>
                <h5 className="alert-heading mb-1">Verification Complete!</h5>
                <p className="mb-0">All images have been successfully verified. Your claim is now under review.</p>
              </div>
            </div>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default CarVerification;
