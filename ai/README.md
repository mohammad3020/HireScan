# AI Service - Setup Instructions

## One-Time Setup

### Step 1: Create Backend Virtual Environment (if it doesn't exist)

Navigate to the project root and check if the backend virtual environment exists. If not, create it:

**On macOS/Linux:**
```bash
cd /Users/mohammad/Projects/Rahnema/HireScan

# Check if venv exists, if not create it
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
    echo "✅ Backend virtual environment created"
else
    echo "✅ Backend virtual environment already exists"
fi
```

**On Windows:**
```bash
cd /Users/mohammad/Projects/Rahnema/HireScan

# Check if venv exists, if not create it
if not exist "backend\venv" (
    python -m venv backend\venv
    echo ✅ Backend virtual environment created
) else (
    echo ✅ Backend virtual environment already exists
)
```

**Or manually:**
```bash
cd /Users/mohammad/Projects/Rahnema/HireScan
python3 -m venv backend/venv
```

### Step 2: Activate Backend Virtual Environment

**On macOS/Linux:**
```bash
source backend/venv/bin/activate
```

**On Windows:**
```bash
backend\venv\Scripts\activate
```

### Step 3: Install Dependencies

The backend virtual environment should already have most dependencies. If needed, install from the ai requirements:

```bash
pip install -r ai/requirements.txt
```

This will install:
- `requests` - For API calls
- `pypdf` - For PDF text extraction
- `python-docx` - For DOCX text extraction
- `python-dotenv` - For loading environment variables

**Note:** These packages may already be installed in the backend venv. If you get import errors, run this command.

### Step 4: Set Up Environment Variables

Create a `.env` file in the **project root** (not in the `ai/` folder):

**Location:** `/Users/mohammad/Projects/Rahnema/HireScan/.env`

**Content:**
```env
OPENROUTER_API_KEY=your-actual-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Replace `your-actual-api-key-here` with your actual OpenRouter API key.

**Note:** 
- The `.env` file is already in `.gitignore`, so it won't be committed to git
- Model name is passed as a parameter to the function, not from environment variables

**Alternative:** You can also export the API key in your terminal:
```bash
export OPENROUTER_API_KEY='your-api-key-here'
```

---

## Running the Test (Each Time)

### Step 1: Navigate to Project Root and Activate Backend Virtual Environment

**On macOS/Linux:**
```bash
cd /Users/mohammad/Projects/Rahnema/HireScan
source backend/venv/bin/activate
```

**On Windows:**
```bash
cd /Users/mohammad/Projects/Rahnema/HireScan
backend\venv\Scripts\activate
```

### Step 2: Navigate to AI Folder and Run the Test

```bash
cd ai
```

**Use default model (anthropic/claude-3.5-sonnet) with direct file upload (default):**
```bash
python test_service.py
```

**Specify a different model:**
```bash
python test_service.py "openai/gpt-4"
python test_service.py "google/gemini-pro"
python test_service.py "anthropic/claude-3-opus"
python test_service.py "meta-llama/llama-3-70b-instruct"
```

**Use pypdf for text extraction instead of direct file upload:**
```bash
python test_service.py --use-pypdf
python test_service.py "anthropic/claude-3.5-sonnet" --use-pypdf
```

**Specify PDF processing engine (only used when not using pypdf):**
```bash
# Use free pdf-text engine (default)
python test_service.py --pdf-engine pdf-text

# Use mistral-ocr for scanned documents (paid)
python test_service.py --pdf-engine mistral-ocr

# Use model's native file processing
python test_service.py --pdf-engine native
```

**Or as a one-liner from project root:**
```bash
cd /Users/mohammad/Projects/Rahnema/HireScan && source backend/venv/bin/activate && cd ai && python test_service.py
```

### What the Test Does

The test script will:
- Automatically load `.env` from the project root if it exists
- Accept model name as command-line argument (or use default)
- Process `Pe-CV2.pdf` with the `parse_resume` prompt
- By default, sends PDF directly to OpenRouter (no local text extraction)
- Use `--use-pypdf` flag to extract text locally using pypdf instead
- Display results in the terminal
- Save results to `test_output.json`

---

## File Processing Methods

The AI service supports two methods for processing PDF files:

### 1. Direct File Upload to OpenRouter (Default)
- **Default behavior**: PDFs are sent directly to OpenRouter without local text extraction
- **Advantages**:
  - Better handling of complex PDF layouts
  - Support for scanned PDFs via OCR engines
  - No dependency on pypdf for PDF processing
  - OpenRouter handles PDF parsing with specialized engines
- **PDF Engines**:
  - `pdf-text` (default, free): Best for well-structured PDFs
  - `mistral-ocr` (paid): Best for scanned documents or PDFs with images
  - `native`: Use model's native file processing capabilities

### 2. Local Text Extraction with pypdf
- **Usage**: Set `use_pypdf=True` or use `--use-pypdf` flag in test script
- **Advantages**:
  - Full control over text extraction
  - Can inspect extracted text before sending to API
  - Useful for debugging or when you need the raw text
- **Note**: DOCX files always use text extraction (OpenRouter doesn't support DOCX natively)

## Quick Reference

### Available Models (Examples)
- `anthropic/claude-3.5-sonnet` (default, recommended)
- `anthropic/claude-3-opus`
- `openai/gpt-4`
- `openai/gpt-4-turbo`
- `google/gemini-pro`
- `google/gemini-pro-1.5`
- `meta-llama/llama-3-70b-instruct`
- `mistralai/mistral-large`

See [OpenRouter Models](https://openrouter.ai/models) for the full list.

### Troubleshooting

**If you get "ModuleNotFoundError":**
- Make sure the backend virtual environment is activated: `source backend/venv/bin/activate`
- Install dependencies: `pip install -r ai/requirements.txt`

**If you get "OPENROUTER_API_KEY is not set":**
- Check that `.env` file exists in the project root
- Or export the API key: `export OPENROUTER_API_KEY='your-key'`

**If PDF processing fails:**
- The service automatically extracts text from PDFs (more reliable)
- Make sure `pypdf` is installed: `pip install pypdf`
