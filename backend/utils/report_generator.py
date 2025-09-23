import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
import base64

class ReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.report_dir = "static/reports"
        os.makedirs(self.report_dir, exist_ok=True)
        
        # Custom styles
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1e3a8a')
        )
        
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#3b82f6')
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6
        )

    def generate_pdf_report(self, claim, format='pdf', include_images=True, include_analysis=True):
        """Generate a comprehensive PDF report for the claim"""
        
        filename = f"claim_report_{claim.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.report_dir, filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build story (content)
        story = []
        
        # Title
        story.append(Paragraph("INSURANCE CLAIM REPORT", self.title_style))
        story.append(Spacer(1, 20))
        
        # Header info table
        header_data = [
            ['Claim ID:', str(claim.id), 'Date Generated:', datetime.now().strftime('%B %d, %Y')],
            ['Policy Number:', claim.policy_number, 'Status:', claim.status.upper()],
            ['Accident Date:', claim.accident_date.strftime('%B %d, %Y'), 'Location:', claim.location]
        ]
        
        header_table = Table(header_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(header_table)
        story.append(Spacer(1, 20))
        
        # Claim Description
        story.append(Paragraph("Claim Description", self.heading_style))
        story.append(Paragraph(claim.description, self.normal_style))
        story.append(Spacer(1, 15))
        
        # Assessment Results
        story.append(Paragraph("Assessment Results", self.heading_style))
        
        assessment_data = [
            ['Damage Score:', f"{claim.damage_score:.1%}" if claim.damage_score else "Not Available"],
            ['Cost Estimate:', f"${claim.cost_estimate:,.2f}" if claim.cost_estimate else "Not Available"],
            ['Fraud Score:', f"{claim.fraud_score:.1%}" if claim.fraud_score else "Not Available"],
            ['Risk Level:', self._get_risk_level(claim.fraud_score) if claim.fraud_score else "Not Assessed"]
        ]
        
        assessment_table = Table(assessment_data, colWidths=[2*inch, 4*inch])
        assessment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(assessment_table)
        story.append(Spacer(1, 20))
        
        # AI Analysis Section
        if include_analysis and claim.ai_analysis:
            story.append(Paragraph("AI Analysis Results", self.heading_style))
            
            if 'damage_analysis' in claim.ai_analysis:
                damage_analysis = claim.ai_analysis['damage_analysis']
                story.append(Paragraph("<b>Damage Assessment:</b>", self.normal_style))
                
                damage_details = [
                    ['Severity:', damage_analysis.get('severity', 'Not Available')],
                    ['Confidence:', f"{damage_analysis.get('confidence', 0):.1%}"],
                    ['Detected Issues:', ', '.join(damage_analysis.get('detected_damages', []))],
                ]
                
                damage_table = Table(damage_details, colWidths=[2*inch, 4*inch])
                damage_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fef3c7')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(damage_table)
                story.append(Spacer(1, 10))
            
            if 'fraud_analysis' in claim.ai_analysis:
                fraud_analysis = claim.ai_analysis['fraud_analysis']
                story.append(Paragraph("<b>Fraud Detection:</b>", self.normal_style))
                
                fraud_details = [
                    ['Risk Level:', fraud_analysis.get('risk_level', 'Not Available')],
                    ['Suspicious Activity:', 'Yes' if fraud_analysis.get('is_suspicious') else 'No'],
                    ['Recommendations:', ', '.join(fraud_analysis.get('recommendations', []))],
                ]
                
                fraud_table = Table(fraud_details, colWidths=[2*inch, 4*inch])
                fraud_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fee2e2')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(fraud_table)
                story.append(Spacer(1, 20))
        
        # Images Section
        if include_images and hasattr(claim, 'images') and claim.images:
            story.append(Paragraph("Submitted Images", self.heading_style))
            
            for i, image in enumerate(claim.images):
                try:
                    if os.path.exists(image.image_path):
                        # Add image with caption
                        img = RLImage(image.image_path, width=3*inch, height=2*inch)
                        story.append(img)
                        
                        caption = f"Image {i+1}: {image.exif_metadata.get('filename', 'Unknown')} ({image.angle})"
                        story.append(Paragraph(caption, self.normal_style))
                        story.append(Spacer(1, 10))
                except Exception as e:
                    # Skip problematic images
                    error_text = f"Image {i+1}: Could not load image ({str(e)})"
                    story.append(Paragraph(error_text, self.normal_style))
                    story.append(Spacer(1, 10))
        
        # Footer
        story.append(Spacer(1, 30))
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        
        story.append(Paragraph(f"Generated by SecureGuard Insurance AI System - {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
        
        # Build PDF
        doc.build(story)
        
        return filepath
    
    def _get_risk_level(self, fraud_score):
        """Convert fraud score to risk level text"""
        if fraud_score > 0.7:
            return "HIGH RISK"
        elif fraud_score > 0.4:
            return "MEDIUM RISK"
        else:
            return "LOW RISK"
