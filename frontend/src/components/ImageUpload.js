import React, { useState, useCallback } from 'react';
import { Card, Button, Row, Col, Modal, Image, Badge, Progress, Form, Alert } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';

const ImageUpload = ({ 
  files, 
  setFiles, 
  showPreview = true, 
  showAnalysis = false, 
  claimImages = [], 
  maxFiles = 10,
  allowDownload = false,
  requireCategories = false 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('front');
  
  // Image categories for vehicle damage
  const imageCategories = [
    { value: 'front', label: 'Front View', icon: 'bi-arrow-up-circle', color: 'primary' },
    { value: 'rear', label: 'Rear View', icon: 'bi-arrow-down-circle', color: 'success' },
    { value: 'back', label: 'Back View', icon: 'bi-arrow-left-circle', color: 'warning' },
    { value: 'top', label: 'Top View', icon: 'bi-circle', color: 'info' }
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles,
    multiple: true,
    onDrop: useCallback((acceptedFiles) => {
      console.log('Files dropped:', acceptedFiles);
      const newFiles = acceptedFiles.map(file => {
        const fileObject = {
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'ready',
          id: Math.random().toString(36).substr(2, 9),
          category: selectedCategory,
          categoryLabel: imageCategories.find(cat => cat.value === selectedCategory)?.label
        };
        console.log('Created file object:', fileObject);
        return fileObject;
      });
      console.log('Setting files:', newFiles);
      setFiles(prev => {
        const updated = [...prev, ...newFiles];
        console.log('Updated files array:', updated);
        return updated;
      });
    }, [setFiles, selectedCategory])
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateFileCategory = (index, newCategory) => {
    setFiles(prev => prev.map((file, i) => 
      i === index 
        ? {
            ...file, 
            category: newCategory,
            categoryLabel: imageCategories.find(cat => cat.value === newCategory)?.label
          }
        : file
    ));
  };
  
  const getCategoryStats = () => {
    const stats = imageCategories.reduce((acc, cat) => {
      acc[cat.value] = files.filter(file => file.category === cat.value).length;
      return acc;
    }, {});
    return stats;
  };
  
  const getMissingCategories = () => {
    const stats = getCategoryStats();
    return imageCategories.filter(cat => stats[cat.value] === 0);
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const downloadImage = async (imagePath, filename) => {
    try {
      const response = await axios.get(`/static/${imagePath}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'image.jpg');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const analyzeImage = async (imageFile) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await axios.post('/claims/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Image analysis completed');
      return response.data;
    } catch (error) {
      toast.error('Image analysis failed');
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageTypeIcon = (type) => {
    const typeMap = {
      'front': { icon: 'bi-car-front', color: 'primary', label: 'Front View' },
      'rear': { icon: 'bi-car-front-fill', color: 'secondary', label: 'Rear View' },
      'side': { icon: 'bi-truck-front', color: 'info', label: 'Side View' },
      'interior': { icon: 'bi-house-door', color: 'warning', label: 'Interior' },
      'damage': { icon: 'bi-exclamation-triangle', color: 'danger', label: 'Damage' },
      'document': { icon: 'bi-file-earmark-text', color: 'success', label: 'Document' }
    };
    return typeMap[type] || typeMap['damage'];
  };

  return (
    <div className="image-upload-container">
      {/* Category Selection */}
      {requireCategories && (
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">
              <i className="bi bi-tag me-2"></i>
              Select Image Category
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {imageCategories.map(category => {
                const categoryCount = getCategoryStats()[category.value] || 0;
                return (
                  <Col md={3} key={category.value}>
                    <Form.Check
                      type="radio"
                      id={`category-${category.value}`}
                      name="imageCategory"
                      value={category.value}
                      checked={selectedCategory === category.value}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label={
                        <div className="d-flex align-items-center">
                          <i className={`${category.icon} text-${category.color} me-2`}></i>
                          <span>{category.label}</span>
                          {categoryCount > 0 && (
                            <Badge bg={category.color} className="ms-2">
                              {categoryCount}
                            </Badge>
                          )}
                        </div>
                      }
                      className="mb-2"
                    />
                  </Col>
                );
              })}
            </Row>
            
            {requireCategories && files.length > 0 && (
              <Alert variant="info" className="mt-3 mb-0">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle me-2"></i>
                  <div>
                    <strong>Category Coverage:</strong>
                    <div className="mt-1">
                      {imageCategories.map(cat => {
                        const count = getCategoryStats()[cat.value] || 0;
                        return (
                          <Badge 
                            key={cat.value}
                            bg={count > 0 ? cat.color : 'secondary'} 
                            className="me-2"
                          >
                            {cat.label}: {count}
                          </Badge>
                        );
                      })}
                    </div>
                    {getMissingCategories().length > 0 && (
                      <small className="text-muted d-block mt-2">
                        Missing: {getMissingCategories().map(cat => cat.label).join(', ')}
                      </small>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Type 1: File Upload Area */}
      <Card className="mb-4">
        <Card.Body>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-4 p-4 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
            }`}
            style={{ minHeight: '200px' }}
          >
            <input {...getInputProps()} />
            <div className="d-flex flex-column align-items-center justify-content-center h-100">
              <i 
                className={`bi bi-cloud-upload text-${isDragActive ? 'primary' : 'secondary'} mb-3`} 
                style={{fontSize: '3rem'}}
              ></i>
              <h5 className="mb-2">
                {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
              </h5>
              {requireCategories && (
                <div className="mb-3">
                  <Badge bg={imageCategories.find(cat => cat.value === selectedCategory)?.color || 'primary'}>
                    <i className={`${imageCategories.find(cat => cat.value === selectedCategory)?.icon} me-1`}></i>
                    {imageCategories.find(cat => cat.value === selectedCategory)?.label}
                  </Badge>
                </div>
              )}
              <p className="text-muted mb-3">or</p>
              <Button variant="outline-primary">
                <i className="bi bi-folder2-open me-2"></i>
                Browse Files
              </Button>
              <div className="mt-3">
                <small className="text-muted d-block">
                  <i className="bi bi-info-circle me-1"></i>
                  {maxFiles === 1 ? 'Single file upload' : `Max ${maxFiles} files`}
                </small>
              </div>
            </div>
            <p className="text-muted mb-0">
              Supports JPEG, PNG, GIF, BMP, WebP (Max {maxFiles} files, 10MB each)
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* Type 2: Image Preview Gallery */}
      {showPreview && (
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">
              <i className="bi bi-images me-2"></i>
              Image Gallery ({files.length} {files.length === 1 ? 'file' : 'files'})
              {files.length === 0 && <span className="text-muted"> - No images selected</span>}
            </h6>
          </Card.Header>
          <Card.Body>
            {files.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-images" style={{fontSize: '2rem', opacity: 0.3}}></i>
                <p className="mt-2 mb-0">No images uploaded yet. Use the upload area above to add images.</p>
              </div>
            ) : (
            <Row>
              {files.map((fileItem, index) => {
                console.log('Rendering file item:', fileItem, 'at index:', index);
                const imageSrc = fileItem.preview || (fileItem.file ? URL.createObjectURL(fileItem.file) : null);
                console.log('Image src:', imageSrc);
                
                return (
                <Col md={3} lg={2} className="mb-3" key={fileItem.id || index}>
                  <Card className="h-100 image-preview-card">
                    <div className="position-relative">
                      {imageSrc ? (
                        <Image 
                          src={imageSrc}
                          fluid 
                          className="card-img-top"
                          style={{ 
                            height: '120px', 
                            objectFit: 'cover', 
                            cursor: 'pointer' 
                          }}
                          onClick={() => openImageModal(fileItem)}
                          onError={(e) => {
                            console.error('Image load error:', e);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div 
                          className="d-flex align-items-center justify-content-center bg-light"
                          style={{ height: '120px' }}
                        >
                          <i className="bi bi-image text-muted" style={{fontSize: '2rem'}}></i>
                        </div>
                      )}
                      <div className="position-absolute top-0 end-0 m-1">
                        {requireCategories && fileItem.category && (
                          <Badge 
                            bg={imageCategories.find(cat => cat.value === fileItem.category)?.color || 'secondary'}
                            className="mb-1 d-block"
                          >
                            <i className={`${imageCategories.find(cat => cat.value === fileItem.category)?.icon} me-1`}></i>
                            {fileItem.categoryLabel}
                          </Badge>
                        )}
                        <Badge bg="secondary">
                          {formatFileSize(fileItem.size || fileItem.file?.size || 0)}
                        </Badge>
                      </div>
                    </div>
                    <Card.Body className="p-2">
                      <div className="small text-truncate" title={fileItem.name || fileItem.file?.name}>
                        {fileItem.name || fileItem.file?.name || 'Unknown file'}
                      </div>
                      {requireCategories && (
                        <Form.Select 
                          size="sm" 
                          value={fileItem.category || 'front'}
                          onChange={(e) => updateFileCategory(index, e.target.value)}
                          className="mb-2"
                        >
                          {imageCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      <div className="d-flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openImageModal(fileItem)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        {showAnalysis && (
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => analyzeImage(fileItem.file)}
                            disabled={analyzing}
                          >
                            <i className="bi bi-cpu"></i>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => removeFile(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                );
              })}
            </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Type 3: Existing Claim Images with Analysis */}
      {claimImages.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">
              <i className="bi bi-collection me-2"></i>
              Claim Images & Analysis
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {claimImages.map((image, index) => {
                const typeInfo = getImageTypeIcon(image.angle || 'damage');
                return (
                  <Col md={4} lg={3} className="mb-3" key={index}>
                    <Card className="h-100">
                      <div className="position-relative">
                        <Image 
                          src={`/static/${image.image_path}`}
                          fluid 
                          className="card-img-top"
                          style={{ 
                            height: '150px', 
                            objectFit: 'cover', 
                            cursor: 'pointer' 
                          }}
                          onClick={() => openImageModal({
                            ...image,
                            preview: `/static/${image.image_path}`,
                            isExisting: true
                          })}
                        />
                        <Badge 
                          bg={typeInfo.color}
                          className="position-absolute top-0 start-0 m-1"
                        >
                          <i className={`${typeInfo.icon} me-1`}></i>
                          {typeInfo.label}
                        </Badge>
                        {image.ai_analysis && (
                          <Badge 
                            bg="success"
                            className="position-absolute top-0 end-0 m-1"
                          >
                            <i className="bi bi-robot"></i>
                          </Badge>
                        )}
                      </div>
                      <Card.Body className="p-2">
                        <div className="small mb-2">
                          Uploaded: {new Date(image.uploaded_at).toLocaleDateString()}
                        </div>
                        {image.exif_metadata && (
                          <div className="small text-muted mb-2">
                            {image.exif_metadata.filename}
                          </div>
                        )}
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openImageModal({
                              ...image,
                              preview: `/static/${image.image_path}`,
                              isExisting: true
                            })}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          {allowDownload && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => downloadImage(
                                image.image_path, 
                                image.exif_metadata?.filename
                              )}
                            >
                              <i className="bi bi-download"></i>
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Type 4: Image Modal for Full View and Analysis */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-image me-2"></i>
            Image Details
            {selectedImage?.isExisting && (
              <Badge bg="info" className="ms-2">Existing Image</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedImage && (
            <Row>
              <Col md={8}>
                <Image 
                  src={selectedImage.preview} 
                  fluid 
                  className="w-100"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </Col>
              <Col md={4}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Image Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>Name:</strong> {selectedImage.name || selectedImage.exif_metadata?.filename}</p>
                    {selectedImage.size && (
                      <p><strong>Size:</strong> {formatFileSize(selectedImage.size)}</p>
                    )}
                    {selectedImage.type && (
                      <p><strong>Type:</strong> {selectedImage.type}</p>
                    )}
                    {selectedImage.angle && (
                      <p><strong>Angle:</strong> 
                        <Badge bg="info" className="ms-2">
                          {getImageTypeIcon(selectedImage.angle).label}
                        </Badge>
                      </p>
                    )}
                    {selectedImage.image_hash && (
                      <p><strong>Hash:</strong> 
                        <small className="text-muted d-block">
                          {selectedImage.image_hash.substring(0, 16)}...
                        </small>
                      </p>
                    )}
                  </Card.Body>
                </Card>

                {/* AI Analysis Results */}
                {selectedImage.ai_analysis && (
                  <Card className="mt-3">
                    <Card.Header>
                      <h6 className="mb-0">
                        <i className="bi bi-robot me-2"></i>
                        AI Analysis
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {selectedImage.ai_analysis.damage_analysis && (
                        <div className="mb-3">
                          <h6 className="text-primary">Damage Assessment</h6>
                          <p><strong>Severity:</strong> 
                            <Badge 
                              bg={selectedImage.ai_analysis.damage_analysis.severity === 'severe' ? 'danger' : 
                                  selectedImage.ai_analysis.damage_analysis.severity === 'moderate' ? 'warning' : 'success'}
                              className="ms-2"
                            >
                              {selectedImage.ai_analysis.damage_analysis.severity}
                            </Badge>
                          </p>
                          <p><strong>Confidence:</strong> {Math.round(selectedImage.ai_analysis.damage_analysis.confidence * 100)}%</p>
                          {selectedImage.ai_analysis.damage_analysis.detected_damages && (
                            <div>
                              <strong>Detected Issues:</strong>
                              {selectedImage.ai_analysis.damage_analysis.detected_damages.map((damage, idx) => (
                                <Badge key={idx} bg="warning" className="ms-1 mb-1">
                                  {damage}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {selectedImage.ai_analysis.fraud_analysis && (
                        <div>
                          <h6 className="text-danger">Fraud Detection</h6>
                          <p><strong>Risk Level:</strong> 
                            <Badge 
                              bg={selectedImage.ai_analysis.fraud_analysis.risk_level === 'high' ? 'danger' : 
                                  selectedImage.ai_analysis.fraud_analysis.risk_level === 'medium' ? 'warning' : 'success'}
                              className="ms-2"
                            >
                              {selectedImage.ai_analysis.fraud_analysis.risk_level}
                            </Badge>
                          </p>
                          <p><strong>Suspicious:</strong> 
                            {selectedImage.ai_analysis.fraud_analysis.is_suspicious ? 
                              <Badge bg="danger" className="ms-2">Yes</Badge> : 
                              <Badge bg="success" className="ms-2">No</Badge>
                            }
                          </p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedImage?.isExisting && allowDownload && (
            <Button 
              variant="success"
              onClick={() => downloadImage(
                selectedImage.image_path, 
                selectedImage.exif_metadata?.filename
              )}
            >
              <i className="bi bi-download me-2"></i>
              Download
            </Button>
          )}
          {!selectedImage?.isExisting && showAnalysis && (
            <Button 
              variant="info"
              onClick={() => analyzeImage(selectedImage.file)}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="bi bi-cpu me-2"></i>
                  Analyze Image
                </>
              )}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .upload-dropzone:hover {
          border-color: #0d6efd !important;
          background-color: #f8f9fa !important;
        }
        
        .dragover {
          border-color: #0d6efd !important;
          background-color: #e7f3ff !important;
        }
        
        .image-preview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;
