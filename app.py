from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import hashlib
from datetime import datetime
import random
try:
    from models.damage_assessor import DamageAssessor
    from models.fraud_detector import FraudDetector  
    from utils.report_generator import ReportGenerator
except ImportError as e:
    print(f"Import warning: {e}")
    # Create dummy classes for testing
    class DamageAssessor:
        def analyze_images(self, paths):
            return {'damage_score': 0.65, 'cost_estimate': 45000, 'confidence': 0.85, 'severity': 'moderate', 'detected_damages': ['dent', 'scratch'], 'recommendations': ['Professional repair needed']}
    
    class FraudDetector:
        def check_images(self, paths):
            return {'fraud_score': 0.25, 'risk_level': 'low', 'is_suspicious': False, 'detected_issues': [], 'recommendations': ['Images appear authentic']}
    
    class ReportGenerator:
        def generate_pdf_report(self, claim):
            return f"static/reports/claim_report_{claim.id}.pdf"

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///insurance_claims.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Session configuration for concurrent logins
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Configure Flask-Login for concurrent sessions
login_manager.session_protection = "basic"  # Allow concurrent sessions
login_manager.refresh_view = None

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    claims = db.relationship('Claim', backref='user', lazy=True)

class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    policy_number = db.Column(db.String(50), nullable=False)
    accident_date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, review
    damage_score = db.Column(db.Float, default=0.0)
    cost_estimate = db.Column(db.Float, default=0.0)
    fraud_score = db.Column(db.Float, default=0.0)
    ai_analysis = db.Column(db.JSON)
    report_file = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    images = db.relationship('ClaimImage', backref='claim', lazy=True, cascade='all, delete-orphan')

class ClaimImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    claim_id = db.Column(db.Integer, db.ForeignKey('claim.id'), nullable=False)
    image_path = db.Column(db.String(200), nullable=False)
    image_hash = db.Column(db.String(64), nullable=False)
    exif_metadata = db.Column(db.JSON)
    angle = db.Column(db.String(20))  # front, rear, side, top
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize AI models
damage_assessor = DamageAssessor()
fraud_detector = FraudDetector()
report_generator = ReportGenerator()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/features')
def features():
    return render_template('features.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists', 'error')
            return redirect(url_for('register'))
        
        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember', False)
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            # Enable concurrent sessions by setting remember and fresh session
            login_user(user, remember=bool(remember), fresh=True)
            session.permanent = True
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('auth/login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.is_admin:
        return redirect(url_for('admin_dashboard'))
    
    user_claims = Claim.query.filter_by(user_id=current_user.id).order_by(Claim.created_at.desc()).all()
    return render_template('dashboard/user_dashboard.html', claims=user_claims)

@app.route('/admin')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    all_claims = Claim.query.order_by(Claim.created_at.desc()).all()
    stats = {
        'total_claims': Claim.query.count(),
        'pending_claims': Claim.query.filter_by(status='pending').count(),
        'approved_claims': Claim.query.filter_by(status='approved').count(),
        'high_risk_claims': Claim.query.filter(Claim.fraud_score > 0.7).count()
    }
    return render_template('dashboard/admin_dashboard.html', claims=all_claims, stats=stats)

@app.route('/claim/new', methods=['GET', 'POST'])
@login_required
def new_claim():
    if request.method == 'POST':
        # Create new claim
        claim = Claim(
            user_id=current_user.id,
            policy_number=request.form.get('policy_number'),
            accident_date=datetime.strptime(request.form.get('accident_date'), '%Y-%m-%d').date(),
            location=request.form.get('location'),
            description=request.form.get('description')
        )
        
        db.session.add(claim)
        db.session.flush()  # Get claim ID
        
        # Handle uploaded images
        uploaded_files = request.files.getlist('images')
        angles = request.form.getlist('angles')
        
        image_paths = []
        for i, file in enumerate(uploaded_files):
            if file and file.filename:
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"claim_{claim.id}_{timestamp}_{i}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Calculate image hash
                with open(filepath, 'rb') as f:
                    image_hash = hashlib.sha256(f.read()).hexdigest()
                
                # Extract EXIF data
                exif_data = {'timestamp': timestamp, 'filename': filename}
                
                claim_image = ClaimImage(
                    claim_id=claim.id,
                    image_path=filepath,
                    image_hash=image_hash,
                    exif_metadata=exif_data,
                    angle=angles[i] if i < len(angles) else 'unknown'
                )
                
                db.session.add(claim_image)
                image_paths.append(filepath)
        
        # Run AI analysis
        ai_results = damage_assessor.analyze_images(image_paths)
        fraud_results = fraud_detector.check_images(image_paths)
        
        # Update claim with AI results
        claim.damage_score = ai_results['damage_score']
        claim.cost_estimate = ai_results['cost_estimate']
        claim.fraud_score = fraud_results['fraud_score']
        claim.ai_analysis = {
            'damage_analysis': ai_results,
            'fraud_analysis': fraud_results
        }
        
        # Auto-approve or flag for review
        if fraud_results['fraud_score'] > 0.7:
            claim.status = 'review'
        elif ai_results['confidence'] > 0.8:
            claim.status = 'approved'
        else:
            claim.status = 'review'
        
        db.session.commit()
        
        flash('Claim submitted successfully! AI analysis completed.', 'success')
        return redirect(url_for('view_claim', claim_id=claim.id))
    
    return render_template('claim/new_claim.html')

@app.route('/claim/<int:claim_id>')
@login_required
def view_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    
    # Check permission
    if not current_user.is_admin and claim.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))
    
    return render_template('claim/view_claim.html', claim=claim)

@app.route('/claim/<int:claim_id>/report')
@login_required
def generate_report(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    
    # Check permission
    if not current_user.is_admin and claim.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))
    
    report_path = report_generator.generate_pdf_report(claim)
    return send_file(report_path, as_attachment=True, download_name=f'claim_report_{claim.id}.pdf')

@app.route('/admin/claim/<int:claim_id>/update', methods=['POST'])
@login_required
def update_claim_status(claim_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    claim = Claim.query.get_or_404(claim_id)
    new_status = request.json.get('status')
    
    if new_status in ['pending', 'approved', 'rejected', 'review']:
        claim.status = new_status
        claim.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True, 'status': new_status})
    
    return jsonify({'error': 'Invalid status'}), 400

@app.route('/api/stats')
@login_required
def api_stats():
    if not current_user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    stats = {
        'total_claims': Claim.query.count(),
        'pending_claims': Claim.query.filter_by(status='pending').count(),
        'approved_claims': Claim.query.filter_by(status='approved').count(),
        'rejected_claims': Claim.query.filter_by(status='rejected').count(),
        'review_claims': Claim.query.filter_by(status='review').count(),
        'high_risk_claims': Claim.query.filter(Claim.fraud_score > 0.7).count(),
        'total_cost_estimates': db.session.query(db.func.sum(Claim.cost_estimate)).scalar() or 0
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create admin user if doesn't exist
        admin = User.query.filter_by(email='admin@123').first()
        if not admin:
            admin = User(
                name='Admin User',
                email='admin@123',
                password_hash=generate_password_hash('admin@123'),
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin user created: admin@123 / admin@123")
    
    app.run(debug=True, port=5000)
