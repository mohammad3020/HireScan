# HireScan

An AI-powered Applicant Tracking System (ATS) for parsing, scoring, and ranking resumes against Job Descriptions (JDs).

HireScan streamlines the recruitment process by automatically parsing resumes, extracting candidate information, scoring candidates against job requirements, and providing a comprehensive review dashboard for recruiters.

## 🚀 Features

### Core Functionality

#### Job Description Management
- **Create & Manage Jobs**: Create, update, and manage job postings with comprehensive details
- **Advanced Filters**: 
  - Experience levels: Intern, Junior, Mid-level, Senior, Lead, Management
  - Employment types: Full-time, Part-time, Contract, Internship, Temporary
  - Salary range with "Any" option (no salary restriction)
  - Demographic requirements (age, gender, military status, education)
- **Auto-Reject Rules**: Configure automatic rejection based on:
  - Minimum years of experience
  - Age range
  - Gender requirements
  - Military service status
  - Education level and major
- **Target Companies & Universities**: Specify preferred companies and universities for scoring
- **Required Skills**: Define critical, important, and nice-to-have skills with priority levels

#### Resume Processing
- **Batch Upload**: Upload up to 100 resumes at once (supports PDF, DOC, DOCX formats)
- **AI-Powered Parsing**: Automatically extract structured candidate data including:
  - Personal information (name, contact, address, date of birth, marital status, military service)
  - Work experience with grouped job titles (identical titles grouped under single header)
  - Education history with university categorization
  - Technical and soft skills
  - Projects, awards, publications
  - Languages with proficiency levels
  - Courses and certifications
  - Expected salary extraction

#### Intelligent Scoring System
- **EDS (Experience Depth Score)**: Evaluates candidate experience based on:
  - Duration and depth of work experience
  - Company quality multiplier (Target/Reputable/Other)
  - Geographic multiplier (US/EU/Others)
  - Role depth factor (Executive/Lead/Senior/Mid/Junior/Intern)
  - Skill match score (semantic analysis)
- **ELS (Education & Learning Score)**: Evaluates education and learning:
  - Highest degree level (PhD/Master's/Bachelor's/Associate)
  - Education relevance to job
  - University tier (Top 50/Top 200/Top 500/Regional/Local)
  - Courses and certifications count
- **Overall Score**: Weighted combination (70% EDS + 30% ELS)
- **Seniority Match Score**: Evaluates fit based on optimal score ranges for each seniority level

#### AI Review & Interpretation
- **Seniority Fit Analysis**: Perfect/Good/Moderate/Poor fit assessment
- **Strengths**: AI-identified candidate strengths
- **Weaknesses**: AI-identified candidate weaknesses
- **Overall Assessment**: Comprehensive candidate evaluation
- **Recommendations**: AI-generated hiring recommendations

#### Candidate Management
- **Detailed Profiles**: Complete candidate information with timeline
- **Notes System**: Add and manage notes for each candidate
- **Favorites**: Mark candidates as favorites
- **State Management**: Track candidate status:
  - Shortlisted
  - Interview Scheduled
  - Interviewed
  - Offer Sent
  - Hired
  - Rejected
- **Timeline Events**: Track upload, parsing, and scoring events
- **Skills Visualization**: Display technical, soft, and mentioned skills

#### Review Dashboard
- **KPIs**: Total candidates, shortlisted count, interview scheduled, interviewed, offer sent, hired
- **Candidate Filtering**: Filter by status, favorites, search by name/email/skills
- **Sorting**: Sort by score, experience, education, skills, name, state
- **Bucket View**: View candidates by category (All, Shortlisted, Favorite, Interview Scheduled, etc.)
- **Ranking System**: Global ranking of candidates per job using OpenRouter AI

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework (DRF)
- **Database**: SQLite (for MVP, easily upgradeable to PostgreSQL/MySQL)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **AI Integration**: OpenRouter APIs for LLM-powered parsing and ranking
- **File Processing**: 
  - `pypdf` for PDF text extraction
  - `python-docx` for DOCX file processing
- **Rate Limiting**: Built-in rate limiter for API requests
- **Logging**: Comprehensive logging system for debugging and monitoring

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom design system
- **State Management**: 
  - React Query (@tanstack/react-query) for server state
  - Zustand for UI state management (favorites, candidates store)
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Routing**: React Router v7

### AI Service
- **Service**: Standalone AI service module (`ai/` directory)
- **LLM Provider**: OpenRouter (supports multiple models)
- **Prompts**: Markdown-based prompt templates stored in `ai/prompts/`
  - `parse_resume.md`: Comprehensive resume parsing prompt
  - Structured JSON output format
- **Processing**: Automated text extraction and JSON-structured parsing
- **Error Handling**: Graceful error handling with fallbacks

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: 3.10 - 3.13 (⚠️ Python 3.14 is not supported by Django yet)
- **Node.js**: 18+ and npm/yarn
- **OpenRouter API Key**: Required for AI features
  - Sign up at [OpenRouter](https://openrouter.ai/)
  - Get your API key from the dashboard
  - Recommended model: `openai/gpt-4o-mini` (cost-effective) or `openai/gpt-4o` (higher quality)

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
   Create a `.env` file in the `backend/` directory:
   ```env
   # Required
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=openai/gpt-4o-mini
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

   # Django Settings
   DJANGO_SECRET_KEY=your_secret_key_here
   DJANGO_DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Database (optional, defaults to SQLite)
   # DATABASE_URL=postgresql://user:password@localhost/hirescan
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```
   This allows you to access the Django admin panel at `http://localhost:8000/admin`

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

3. **Configure API endpoint (if needed):**
   The frontend is configured to connect to `http://localhost:8000` by default. If your backend runs on a different port, update the API base URL in `frontend/src/api/` files.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### AI Service Setup

The AI service is located in the `ai/` directory and is automatically used by the backend. No additional setup is required, but ensure:

1. Your OpenRouter API key is set in the backend `.env` file
2. The `ai/prompts/` directory contains the necessary prompt templates:
   - `parse_resume.md`: Main resume parsing prompt
   - `parse_resume sample.md`: Sample output format

To install AI service dependencies separately (optional):
```bash
cd ai
pip install -r requirements.txt
```

## 📁 Project Structure

```
HireScan/
├── backend/                    # Django backend application
│   ├── candidates/            # Candidate models & APIs
│   │   ├── models.py          # Candidate, Resume, ParsedResume, Experience, Education, etc.
│   │   ├── serializers.py     # API serializers
│   │   ├── views.py           # ViewSets and API endpoints
│   │   └── urls.py            # URL routing
│   ├── core/                  # Core utilities
│   │   ├── openrouter.py      # OpenRouter API client
│   │   ├── permissions.py     # Custom permissions
│   │   ├── views.py           # Authentication views
│   │   └── urls.py            # Auth endpoints
│   ├── jobs/                  # Job Description models & APIs
│   │   ├── models.py          # Job, Department, Skill models
│   │   ├── serializers.py     # Job serializers
│   │   ├── views.py           # Job ViewSets
│   │   └── urls.py            # Job endpoints
│   ├── processing/            # Batch upload, resume parsing, scoring, ranking
│   │   ├── models.py          # BatchUpload model
│   │   ├── services.py        # Core processing logic
│   │   ├── views.py           # Processing endpoints
│   │   └── urls.py            # Processing routes
│   ├── hirescan/              # Django project settings
│   │   ├── settings.py        # Main settings file
│   │   ├── urls.py            # Root URL configuration
│   │   └── wsgi.py            # WSGI config
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   ├── db.sqlite3             # SQLite database (development)
│   ├── media/                  # Uploaded files (resumes, etc.)
│   │   ├── resumes/           # Uploaded resume files
│   │   └── batch_uploads/     # Batch upload files
│   └── logs/                   # Application logs
│       ├── hirescan.log        # Main application log
│       ├── openrouter_api.log  # OpenRouter API log
│       └── timing.log          # Performance timing log
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── api/               # API client functions
│   │   │   ├── candidates.ts  # Candidate API hooks
│   │   │   ├── jobs.ts        # Job API hooks
│   │   │   ├── review.ts      # Review dashboard hooks
│   │   │   └── auth.ts        # Authentication hooks
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Layout.tsx     # Main layout component
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.tsx           # Main dashboard
│   │   │   ├── Jobs.tsx               # Jobs list
│   │   │   ├── JobForm.tsx            # Create/Edit job
│   │   │   ├── JobProfile.tsx         # Job details
│   │   │   ├── Upload.tsx             # Resume upload
│   │   │   ├── Processing.tsx         # Processing status
│   │   │   ├── Review.tsx             # Review dashboard
│   │   │   ├── ReviewCandidatesTab.tsx # Candidates tab
│   │   │   ├── CandidateDetail.tsx    # Candidate profile
│   │   │   ├── Login.tsx             # Login page
│   │   │   └── SignUp.tsx            # Sign up page
│   │   ├── store/             # Zustand stores
│   │   │   ├── auth.ts        # Authentication store
│   │   │   └── candidates.ts  # Candidates store
│   │   ├── utils/             # Utility functions
│   │   │   └── resumeValidator.ts
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Node.js dependencies
│   ├── vite.config.ts        # Vite configuration
│   └── tailwind.config.js     # Tailwind CSS config
│
├── ai/                         # AI service module
│   ├── prompts/               # LLM prompt templates
│   │   ├── parse_resume.md    # Main parsing prompt
│   │   └── parse_resume sample.md
│   ├── service.py             # AI service functions
│   ├── test_service.py        # Service tests
│   └── requirements.txt       # AI dependencies
│
├── README.md                   # This file
├── PYTHON_VERSION_GUIDE.md    # Python version compatibility guide
├── API_CONNECTION_STATUS.md   # API connection status documentation
├── SMOKE_TEST.md              # Smoke test guide
└── .env.example               # Environment variables template
```

## 🚀 Running the Application

### Quick Start

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

### Using Batch Scripts (Windows)

For Windows users, you can use the provided batch script:
```bash
start_servers.bat
```

This will start both backend and frontend servers automatically.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh JWT token

### Jobs
- `GET /api/jobs/jobs/` - List all jobs
- `GET /api/jobs/jobs/{id}/` - Get job details
- `POST /api/jobs/jobs/` - Create new job
- `PATCH /api/jobs/jobs/{id}/` - Update job
- `DELETE /api/jobs/jobs/{id}/` - Delete job
- `GET /api/jobs/departments/` - List departments
- `POST /api/jobs/departments/` - Create department

### Candidates
- `GET /api/candidates/candidates/` - List all candidates
- `GET /api/candidates/candidates/{id}/detail/` - Get candidate details
- `POST /api/candidates/candidates/{id}/add_note/` - Add note to candidate
- `DELETE /api/candidates/notes/{id}/` - Delete note
- `PATCH /api/candidates/job-scores/{id}/category/` - Update candidate state

### Batch Processing
- `GET /api/batch/batches/` - List batch uploads
- `GET /api/batch/batches/{id}/` - Get batch details
- `POST /api/batch/batches/` - Create new batch
- `POST /api/batch/batches/{id}/upload_files/` - Upload files to batch
- `GET /api/batch/batches/{id}/status/` - Get batch processing status

### Review & Ranking
- `GET /api/review/review/?jobId={id}` - Get review dashboard data
- `POST /api/review/ranking/{job_id}/refresh/` - Refresh candidate ranking

## 📝 Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Required - OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Django Settings
DJANGO_SECRET_KEY=your_secret_key_here
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optional, defaults to SQLite)
# DATABASE_URL=postgresql://user:password@localhost/hirescan

# Media Files (optional)
# MEDIA_ROOT=/path/to/media
# MEDIA_URL=/media/
```

## 🎯 Key Features Explained

### Work Experience Grouping
When a candidate has multiple positions with the same job title, they are automatically grouped under a single header. For example:
- **Social Media Manager** (header)
  - Company A (2020-2022)
  - Company B (2022-2023)
  - Company C (2023-Present)

### AI Review System
The AI Review section provides:
- **Seniority Fit Analysis**: Evaluates how well the candidate matches the required seniority level
- **Strengths**: AI-identified positive attributes
- **Weaknesses**: Areas that may need attention
- **Overall Assessment**: Comprehensive evaluation summary

### Scoring System Details

#### EDS (Experience Depth Score)
```
EDS = min(100, 10 × Y_weighted)

Y_weighted = Σ(duration × M × GM × RDF × SMS^0.7) / 12
```
Where:
- **M**: Company Quality Multiplier (Target: 1.5, Reputable: 1.2, Other: 1.0)
- **GM**: Geographic Multiplier (US: 1.5, EU/East Asia/Canada: 1.2, Others: 1.0)
- **RDF**: Role Depth Factor (Executive: 1.5, Lead: 1.4, Senior: 1.2, Mid: 1.1, Junior: 1.0, Intern: 0.7)
- **SMS**: Skill Match Score (0-1, semantic analysis)

#### ELS (Education & Learning Score)
```
ELS = min(100, 0.20×S_degree + 0.25×S_relevance + 0.20×S_university + 0.15×S_courses + 0.15×S_cert)
```

#### Overall Score
```
Overall = 0.70 × EDS + 0.30 × ELS
```

#### Seniority Match Score
Evaluates candidate fit based on optimal score ranges for each seniority level with asymmetric penalties for over/under-qualification.

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

### Smoke Tests
For comprehensive smoke tests and troubleshooting:
- [SMOKE_TEST.md](./SMOKE_TEST.md) - Testing instructions
- [SMOKE_TEST_TROUBLESHOOTING.md](./SMOKE_TEST_TROUBLESHOOTING.md) - Troubleshooting guide

## 📚 Additional Documentation

- [Python Version Guide](./PYTHON_VERSION_GUIDE.md) - Python compatibility information
- [API Connection Status](./API_CONNECTION_STATUS.md) - Current API connection status
- [Smoke Test Guide](./SMOKE_TEST_GUIDE.md) - Testing instructions
- [LOGGING_GUIDE.md](./backend/LOGGING_GUIDE.md) - Backend logging configuration

## 🗄 Database

- **Development**: SQLite (`backend/db.sqlite3`)
- **Production**: Recommended to use PostgreSQL or MySQL
- **Media Files**: Stored in `backend/media/`
- **Migrations**: All migrations are included and should be run on setup

### Database Models

#### Jobs
- Job descriptions with requirements
- Departments
- Skills
- Auto-reject rules
- Demographic requirements

#### Candidates
- Candidate information
- Resumes (file storage)
- Parsed resume data (JSON)
- Experience entries
- Education entries
- Skills (technical, soft, mentioned in job title)
- Projects, awards, languages, courses, certifications, publications
- Notes
- Timeline events

#### Processing
- Batch uploads
- File items
- Processing status tracking

## 🔒 Security Notes

- All API keys and secrets should be stored in `.env` files (never commit to git)
- JWT tokens are used for authentication with refresh token support
- CORS is configured for development (adjust `CORS_ALLOWED_ORIGINS` for production)
- CSRF protection is enabled
- File uploads are validated and stored securely
- Rate limiting is implemented for API requests

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: (Future feature)
- **Accessibility**: ARIA labels and keyboard navigation support
- **Loading States**: Comprehensive loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success and error notifications
- **Sortable Tables**: Click column headers to sort
- **Search & Filter**: Real-time search and filtering
- **Dropdown Menus**: Fixed positioning to avoid overflow issues

## 🚧 Known Limitations

- SQLite database (recommended to upgrade to PostgreSQL for production)
- File size limits (configured in Django settings)
- Rate limiting on OpenRouter API (consider upgrading plan for high volume)
- Single language support (English/Persian parsing, UI in English)

## 🔮 Future Enhancements

- [ ] Multi-language UI support
- [ ] Advanced analytics and reporting
- [ ] Email notifications
- [ ] Candidate communication tools
- [ ] Integration with job boards
- [ ] Export functionality (PDF, Excel)
- [ ] Bulk actions on candidates
- [ ] Advanced search with filters
- [ ] Custom scoring weights
- [ ] Interview scheduling
- [ ] Calendar integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style
- Backend: Follow PEP 8 Python style guide
- Frontend: Follow ESLint configuration
- Use meaningful commit messages
- Add comments for complex logic

## 📄 License

[Add your license information here]

## 🆘 Troubleshooting

### Python Version Issues
If you encounter Django compatibility issues, check [PYTHON_VERSION_GUIDE.md](./PYTHON_VERSION_GUIDE.md)

### API Connection Issues
Check [API_CONNECTION_STATUS.md](./API_CONNECTION_STATUS.md) for current connection status

### Build Issues
- **Frontend**: Clear `node_modules` and reinstall
  ```bash
  cd frontend
  rm -rf node_modules package-lock.json
  npm install
  ```
- **Backend**: Recreate virtual environment
  ```bash
  cd backend
  rm -rf venv
  python -m venv venv
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r requirements.txt
  ```

### Database Issues
- Reset database (⚠️ This will delete all data):
  ```bash
  cd backend
  rm db.sqlite3
  python manage.py migrate
  python manage.py createsuperuser
  ```

### OpenRouter API Issues
- Verify API key is correct
- Check API quota/limits
- Review logs in `backend/logs/openrouter_api.log`
- Try a different model if current one is unavailable

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the documentation files
3. Check application logs in `backend/logs/`
4. Create an issue in the repository

## 🙏 Acknowledgments

- OpenRouter for AI API access
- Django and React communities
- All contributors and users

---

**Made with ❤️ for recruiters and HR professionals**
