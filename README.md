# HireScan

An AI-assisted recruiting platform for parsing, scoring, and ranking resumes against Job Descriptions (JDs).

HireScan streamlines the recruitment process by automatically parsing resumes, extracting candidate information, scoring candidates against job requirements, and providing a comprehensive review dashboard for recruiters.

## 🚀 Features

### Core Functionality
- **Job Description Management**: Create, update, and manage job postings with advanced filters and auto-reject rules
- **Batch Resume Upload**: Upload up to 100 resumes at once (supports PDF, DOC, DOCX formats)
- **AI-Powered Resume Parsing**: Automatically extract structured candidate data including:
  - Personal information and contact details
  - Work experience and employment history
  - Education and certifications
  - Technical and soft skills
  - Projects, awards, publications
  - Languages and courses
- **Intelligent Scoring**: AI-based scoring system that evaluates candidates against specific job requirements
- **Ranking System**: Global ranking of candidates per job description using OpenRouter AI
- **Review Dashboard**: Comprehensive dashboard with KPIs, bottlenecks, and trends
- **Candidate Management**: Detailed candidate profiles with timeline, notes, links, and ratings
- **Authentication**: Secure JWT-based authentication system

## 🛠 Tech Stack

### Backend
- **Framework**: Django 5.x + Django REST Framework (DRF)
- **Database**: SQLite (for MVP, easily upgradeable to PostgreSQL)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **AI Integration**: OpenRouter APIs for LLM-powered parsing and ranking
- **File Processing**: PyPDF2, python-docx for resume extraction

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS with Untitled UI component library
- **State Management**: 
  - React Query (@tanstack/react-query) for server state
  - Zustand for UI state management
- **HTTP Client**: Axios
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

### AI Service
- **Service**: Standalone AI service module (`ai/` directory)
- **LLM Provider**: OpenRouter
- **Prompts**: Markdown-based prompt templates stored in `ai/prompts/`
- **Processing**: Automated text extraction and JSON-structured parsing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: 3.10 - 3.13 (⚠️ Python 3.14 is not supported by Django yet)
- **Node.js**: 18+ and npm/yarn
- **OpenRouter API Key**: Required for AI features
  - Sign up at [OpenRouter](https://openrouter.ai/)
  - Get your API key from the dashboard

> **Note**: If you're using Python 3.14, see [PYTHON_VERSION_GUIDE.md](./PYTHON_VERSION_GUIDE.md) for instructions on downgrading.

## 🔧 Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Create .env file in backend directory
   # Add the following variables:
   OPENROUTER_API_KEY=your_api_key_here
   DJANGO_SECRET_KEY=your_secret_key_here
   DJANGO_DEBUG=True
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### AI Service Setup

The AI service is located in the `ai/` directory and is automatically used by the backend. No additional setup is required, but ensure:

1. Your OpenRouter API key is set in the backend `.env` file
2. The `ai/prompts/` directory contains the necessary prompt templates

To install AI service dependencies separately (optional):
```bash
cd ai
pip install -r requirements.txt
```

## 📁 Project Structure

```
HireScan/
├── backend/                    # Django backend application
│   ├── candidates/             # Candidate models & APIs
│   ├── core/                   # Core utilities, OpenRouter client, auth
│   ├── jobs/                   # Job Description models & APIs
│   ├── processing/             # Batch upload, resume parsing, scoring, ranking
│   ├── hirescan/               # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── media/                  # Uploaded files (resumes, etc.)
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── api/               # API client functions (React Query hooks)
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Jobs.tsx
│   │   │   ├── JobForm.tsx
│   │   │   ├── JobProfile.tsx
│   │   │   ├── Upload.tsx
│   │   │   ├── Processing.tsx
│   │   │   ├── Review.tsx
│   │   │   ├── CandidateDetail.tsx
│   │   │   ├── Login.tsx
│   │   │   └── SignUp.tsx
│   │   └── store/             # Zustand store
│   ├── package.json
│   └── vite.config.ts
│
├── ai/                         # AI service module
│   ├── prompts/               # LLM prompt templates
│   │   ├── parse_resume.md
│   │   └── rank_candidates.md
│   ├── service.py             # AI service functions
│   ├── test_service.py        # Service tests
│   └── requirements.txt
│
├── README.md                   # This file
├── PYTHON_VERSION_GUIDE.md    # Python version compatibility guide
├── API_CONNECTION_STATUS.md   # API connection status documentation
└── .env.example               # Environment variables template
```

## 🚀 Running the Application

1. **Start the backend server** (Terminal 1):
   ```bash
   cd backend
   python manage.py runserver
   ```
   Backend runs on: `http://localhost:8000`

2. **Start the frontend server** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

3. **Access the application:**
   Open your browser and navigate to `http://localhost:5173`

## 📡 API Endpoints

### Jobs
- `GET /api/jobs/jobs/` - List all jobs
- `GET /api/jobs/jobs/{id}/` - Get job details
- `POST /api/jobs/jobs/new/` - Create new job
- `PATCH /api/jobs/jobs/{id}/` - Update job
- `DELETE /api/jobs/jobs/{id}/` - Delete job

### Candidates
- `GET /api/candidates/candidates/` - List all candidates
- `GET /api/candidates/candidates/{id}/detail/` - Get candidate details
- `POST /api/candidates/candidates/{id}/add_note/` - Add note to candidate

### Batch Processing
- `GET /api/batch/batches/` - List batch uploads
- `GET /api/batch/batches/{id}/` - Get batch details
- `POST /api/batch/batches/` - Create new batch
- `POST /api/batch/batches/{id}/upload_files/` - Upload files to batch
- `GET /api/batch/batches/{id}/status/` - Get batch processing status

### Review & Ranking
- `GET /api/review/review/?jobId={id}` - Get review dashboard data
- `POST /api/review/ranking/{job_id}/refresh/` - Refresh candidate ranking

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token

## 📝 Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Django Settings
DJANGO_SECRET_KEY=your_secret_key_here
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optional, defaults to SQLite)
# DATABASE_URL=postgresql://user:password@localhost/hirescan
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### AI Service Tests
```bash
cd ai
python test_service.py
```

For smoke tests and troubleshooting, see:
- [SMOKE_TEST.md](./SMOKE_TEST.md)
- [SMOKE_TEST_TROUBLESHOOTING.md](./SMOKE_TEST_TROUBLESHOOTING.md)

## 📚 Additional Documentation

- [Python Version Guide](./PYTHON_VERSION_GUIDE.md) - Python compatibility information
- [API Connection Status](./API_CONNECTION_STATUS.md) - Current API connection status
- [Smoke Test Guide](./SMOKE_TEST_GUIDE.md) - Testing instructions

## 🗄 Database

- **Development**: SQLite (`backend/db.sqlite3`)
- **Production**: Recommended to use PostgreSQL or MySQL
- **Media Files**: Stored in `backend/media/`

## 🔒 Security Notes

- All API keys and secrets should be stored in `.env` files (never commit to git)
- JWT tokens are used for authentication
- CORS is configured for development (adjust for production)
- CSRF protection is enabled

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license information here]

## 🆘 Troubleshooting

### Python Version Issues
If you encounter Django compatibility issues, check [PYTHON_VERSION_GUIDE.md](./PYTHON_VERSION_GUIDE.md)

### API Connection Issues
Check [API_CONNECTION_STATUS.md](./API_CONNECTION_STATUS.md) for current connection status

### Build Issues
- Ensure all dependencies are installed
- Clear `node_modules` and reinstall if frontend issues occur
- Recreate virtual environment if backend issues occur

## 📞 Support

For issues and questions, please refer to the troubleshooting guides or create an issue in the repository.

