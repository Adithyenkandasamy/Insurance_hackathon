from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

from ..database import get_database
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api/contact", tags=["contact"])

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

@router.post("/send")
async def send_contact_message(
    contact_data: ContactMessage,
    db: Session = Depends(get_database)
):
    """Send contact message via email"""
    try:
        # Email configuration
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL", "your_email@gmail.com")
        sender_password = os.getenv("SENDER_PASSWORD", "your_app_password")
        recipient_email = "adithyen1@gmail.com"
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"InsuranceAI Contact: {contact_data.subject} - From {contact_data.name}"
        
        # Email body
        body = f"""
New contact message from InsuranceAI website:

Name: {contact_data.name}
Email: {contact_data.email}
Subject: {contact_data.subject}

Message:
{contact_data.message}

---
Sent via InsuranceAI Contact System
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            text = msg.as_string()
            server.sendmail(sender_email, recipient_email, text)
            server.quit()
            
            return {
                "message": "Email sent successfully",
                "status": "success",
                "recipient": recipient_email
            }
            
        except Exception as email_error:
            # Fallback: If SMTP fails, log the message and return success
            # In production, you might want to store this in a queue for retry
            print(f"SMTP Error: {email_error}")
            print(f"Contact message from {contact_data.name} ({contact_data.email}): {contact_data.message}")
            
            return {
                "message": "Message received and logged. Email service temporarily unavailable.",
                "status": "logged",
                "fallback": True
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process contact message: {str(e)}"
        )
