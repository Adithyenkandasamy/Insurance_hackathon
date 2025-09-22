from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white, red, green, orange
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
from datetime import datetime
import os

class ReportGenerator:
    """
    Generate PDF reports for insurance claims with AI analysis results
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()
        
    def _create_custom_styles(self):
        """Create custom styles for the report"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=HexColor('#1e3a8a'),
            alignment=TA_CENTER
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            textColor=HexColor('#3b82f6'),
            alignment=TA_LEFT
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=12,
            textColor=HexColor('#1f2937'),
            alignment=TA_LEFT
        ))
        
        # Alert style for high-risk items
        self.styles.add(ParagraphStyle(
            name='AlertText',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=HexColor('#dc2626'),
            leftIndent=20
        ))
        
        # Success style for approved items
        self.styles.add(ParagraphStyle(
            name='SuccessText',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=HexColor('#16a34a'),
            leftIndent=20
        ))

    def generate_pdf_report(self, claim):
        """Generate comprehensive PDF report for insurance claim"""
        # Create reports directory if it doesn't exist
        reports_dir = 'static/reports'
        os.makedirs(reports_dir, exist_ok=True)
        
        # Generate filename
        filename = f"claim_report_{claim.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(reports_dir, filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Build story (content)
        story = []
        
        # Header
        story.extend(self._create_header(claim))
        
        # Claim overview
        story.extend(self._create_claim_overview(claim))
        
        # AI analysis results
        story.extend(self._create_ai_analysis_section(claim))
        
        # Fraud detection results
        story.extend(self._create_fraud_analysis_section(claim))
        
        # Cost estimation
        story.extend(self._create_cost_estimation_section(claim))
        
        # Recommendations
        story.extend(self._create_recommendations_section(claim))
        
        # Footer
        story.extend(self._create_footer())
        
        # Build PDF
        doc.build(story)
        
        return filepath
    
    def _create_header(self, claim):
        """Create report header"""
        story = []
        
        # Company logo placeholder (would use actual logo in production)
        story.append(Paragraph("🛡️ InsuranceAI Company", self.styles['CustomTitle']))
        story.append(Paragraph("AI-Powered Insurance Claim Analysis Report", self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Report info table
        report_data = [
            ['Report Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ['Claim ID:', f'#{claim.id}'],
            ['Policy Number:', claim.policy_number],
            ['Claim Status:', claim.status.upper()],
            ['Claimant:', claim.user.name]
        ]
        
        report_table = Table(report_data, colWidths=[2*inch, 3*inch])
        report_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#e5e7eb'))
        ]))
        
        story.append(report_table)
        story.append(Spacer(1, 30))
        
        return story
    
    def _create_claim_overview(self, claim):
        """Create claim overview section"""
        story = []
        
        story.append(Paragraph("CLAIM OVERVIEW", self.styles['CustomSubtitle']))
        
        overview_data = [
            ['Accident Date:', claim.accident_date.strftime('%Y-%m-%d')],
            ['Location:', claim.location],
            ['Description:', claim.description or 'Not provided'],
            ['Submitted:', claim.created_at.strftime('%Y-%m-%d %H:%M')],
            ['Images Submitted:', str(len(claim.images))]
        ]
        
        overview_table = Table(overview_data, colWidths=[2*inch, 4*inch])
        overview_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f9fafb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#e5e7eb'))
        ]))
        
        story.append(overview_table)
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_ai_analysis_section(self, claim):
        """Create AI damage analysis section"""
        story = []
        
        story.append(Paragraph("AI DAMAGE ANALYSIS", self.styles['CustomSubtitle']))
        
        if claim.ai_analysis and 'damage_analysis' in claim.ai_analysis:
            damage_analysis = claim.ai_analysis['damage_analysis']
            
            # Damage score visualization
            damage_score = damage_analysis.get('damage_score', 0) * 100
            severity = damage_analysis.get('severity', 'unknown')
            
            story.append(Paragraph(f"Damage Severity: {severity.title()}", self.styles['SectionHeader']))
            story.append(Paragraph(f"Overall Damage Score: {damage_score:.1f}%", self.styles['Normal']))
            story.append(Spacer(1, 10))
            
            # Detected damages
            detected_damages = damage_analysis.get('detected_damages', [])
            if detected_damages:
                story.append(Paragraph("Detected Damage Types:", self.styles['SectionHeader']))
                for damage in detected_damages:
                    story.append(Paragraph(f"• {damage.replace('_', ' ').title()}", self.styles['Normal']))
                story.append(Spacer(1, 10))
            
            # Analysis confidence
            confidence = damage_analysis.get('confidence', 0) * 100
            confidence_color = 'SuccessText' if confidence > 80 else ('Normal' if confidence > 60 else 'AlertText')
            story.append(Paragraph(f"Analysis Confidence: {confidence:.1f}%", self.styles[confidence_color]))
            
            # Recommendations
            recommendations = damage_analysis.get('recommendations', [])
            if recommendations:
                story.append(Paragraph("AI Recommendations:", self.styles['SectionHeader']))
                for rec in recommendations:
                    story.append(Paragraph(f"• {rec}", self.styles['Normal']))
        else:
            story.append(Paragraph("No AI analysis data available", self.styles['AlertText']))
        
        story.append(Spacer(1, 20))
        return story
    
    def _create_fraud_analysis_section(self, claim):
        """Create fraud detection analysis section"""
        story = []
        
        story.append(Paragraph("FRAUD DETECTION ANALYSIS", self.styles['CustomSubtitle']))
        
        if claim.ai_analysis and 'fraud_analysis' in claim.ai_analysis:
            fraud_analysis = claim.ai_analysis['fraud_analysis']
            
            fraud_score = fraud_analysis.get('fraud_score', 0) * 100
            risk_level = fraud_analysis.get('risk_level', 'unknown')
            is_suspicious = fraud_analysis.get('is_suspicious', False)
            
            # Risk level with color coding
            risk_colors = {
                'low': 'SuccessText',
                'medium': 'Normal', 
                'high': 'AlertText',
                'critical': 'AlertText'
            }
            
            story.append(Paragraph(f"Fraud Risk Level: {risk_level.upper()}", self.styles[risk_colors.get(risk_level, 'Normal')]))
            story.append(Paragraph(f"Fraud Probability: {fraud_score:.1f}%", self.styles['Normal']))
            story.append(Spacer(1, 10))
            
            # Detected issues
            detected_issues = fraud_analysis.get('detected_issues', [])
            if detected_issues:
                story.append(Paragraph("Detected Issues:", self.styles['SectionHeader']))
                for issue in detected_issues:
                    story.append(Paragraph(f"• {issue.replace('_', ' ').title()}", self.styles['AlertText']))
                story.append(Spacer(1, 10))
            
            # Duplicate images check
            duplicate_count = fraud_analysis.get('duplicate_images', 0)
            if duplicate_count > 0:
                story.append(Paragraph(f"⚠️ {duplicate_count} duplicate images detected", self.styles['AlertText']))
                story.append(Spacer(1, 10))
            
            # Fraud recommendations
            fraud_recommendations = fraud_analysis.get('recommendations', [])
            if fraud_recommendations:
                story.append(Paragraph("Fraud Prevention Recommendations:", self.styles['SectionHeader']))
                for rec in fraud_recommendations:
                    style = 'AlertText' if any(word in rec.lower() for word in ['high', 'fraud', 'investigation']) else 'Normal'
                    story.append(Paragraph(f"• {rec}", self.styles[style]))
        else:
            story.append(Paragraph("No fraud analysis data available", self.styles['AlertText']))
        
        story.append(Spacer(1, 20))
        return story
    
    def _create_cost_estimation_section(self, claim):
        """Create cost estimation section"""
        story = []
        
        story.append(Paragraph("COST ESTIMATION", self.styles['CustomSubtitle']))
        
        # Cost breakdown table
        cost_data = [
            ['Item', 'Amount'],
            ['Estimated Repair Cost', f'₹{claim.cost_estimate:,.2f}'],
            ['Processing Fee', '₹500.00'],
            ['Assessment Fee', '₹300.00'],
        ]
        
        total_cost = claim.cost_estimate + 800  # Add fees
        cost_data.append(['Total Estimated Amount', f'₹{total_cost:,.2f}'])
        
        cost_table = Table(cost_data, colWidths=[3*inch, 2*inch])
        cost_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('BACKGROUND', (-1, -1), (-1, -1), HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 1), (-1, -1), black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTNAME', (-1, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#e5e7eb'))
        ]))
        
        story.append(cost_table)
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_recommendations_section(self, claim):
        """Create final recommendations section"""
        story = []
        
        story.append(Paragraph("FINAL RECOMMENDATIONS", self.styles['CustomSubtitle']))
        
        # Status-based recommendations
        status_recommendations = {
            'approved': [
                "✅ Claim approved for processing",
                "Proceed with repair authorization",
                "Estimated processing time: 3-5 business days"
            ],
            'pending': [
                "📋 Claim under review",
                "Additional documentation may be required",
                "Expected decision within 48 hours"
            ],
            'review': [
                "🔍 Manual review required", 
                "Additional verification needed",
                "Investigation team will contact claimant"
            ],
            'rejected': [
                "❌ Claim rejected",
                "Review rejection reasons carefully",
                "Appeal process available within 30 days"
            ]
        }
        
        recommendations = status_recommendations.get(claim.status, ["Status unknown"])
        
        for rec in recommendations:
            story.append(Paragraph(rec, self.styles['Normal']))
        
        story.append(Spacer(1, 20))
        
        # Next steps
        story.append(Paragraph("Next Steps:", self.styles['SectionHeader']))
        if claim.status == 'approved':
            story.append(Paragraph("1. Repair authorization will be sent via email", self.styles['Normal']))
            story.append(Paragraph("2. Choose authorized repair center from our network", self.styles['Normal']))
            story.append(Paragraph("3. Schedule repair appointment", self.styles['Normal']))
        elif claim.status == 'review':
            story.append(Paragraph("1. Await contact from investigation team", self.styles['Normal']))
            story.append(Paragraph("2. Prepare additional documentation if requested", self.styles['Normal']))
            story.append(Paragraph("3. Cooperate with verification process", self.styles['Normal']))
        
        story.append(Spacer(1, 30))
        return story
    
    def _create_footer(self):
        """Create report footer"""
        story = []
        
        # Disclaimer
        disclaimer = """
        <b>DISCLAIMER:</b> This report is generated by AI-powered analysis systems and should be used in conjunction with 
        human expertise. All recommendations are preliminary and subject to final review by licensed insurance professionals. 
        For questions regarding this report, please contact our claims department.
        """
        
        story.append(Paragraph(disclaimer, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Contact information
        contact_info = """
        <b>Contact Information:</b><br/>
        InsuranceAI Claims Department<br/>
        Email: claims@insuranceai.com<br/>
        Phone:+1-12345_Claim<br/>
        Website: www.insuranceai.com
        """
        
        story.append(Paragraph(contact_info, self.styles['Normal']))
        
        return story
