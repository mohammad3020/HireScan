# Smoke Test - CV Upload & Processing

## Prerequisites
1. Backend server is running (`python manage.py runserver`)
2. Frontend server is running (`npm run dev`)
3. User is logged in
4. At least one job exists in the system
5. OpenRouter API key is configured

## Test Steps

### 1. Navigate to Job Detail Page
- Go to `/jobs/{jobId}?tab=upload` (replace `{jobId}` with an actual job ID)
- Verify the "Upload Resumes" tab is visible and active

### 2. File Selection Test
- **Drag & Drop Test:**
  - Drag a PDF file into the upload area
  - Verify file appears in the "Selected Files" list
  - Verify file name, size, and "Pending" status are displayed
  
- **File Select Button Test:**
  - Click "Select Files" button
  - Select one or more PDF/DOC/DOCX files
  - Verify files appear in the list
  - Verify file count shows correctly (e.g., "Selected Files (2/100)")

### 3. File Validation Test
- Try to select an invalid file type (e.g., .txt, .jpg)
- Verify alert message appears: "Some files were rejected. Only PDF, DOC, DOCX files are allowed."
- Verify invalid files are not added to the list

### 4. File Removal Test
- Add multiple files
- Click the "X" button on one file
- Verify the file is removed from the list
- Verify file count updates correctly

### 5. Upload & Processing Test
- Select 1-3 valid CV files (PDF, DOC, or DOCX)
- Click "Upload & Process" button
- **Verify:**
  - Button shows "Uploading & Processing..." with spinner
  - Button is disabled during upload
  - All files show "Processing..." status with spinner
  - No JavaScript errors in browser console
  - Success message appears: "Successfully processed X out of Y files"
  - Files show "Completed" status with green checkmark
  - If batch_id exists, page redirects to `/processing/{batchId}` after 2 seconds

### 6. Error Handling Test
- Try uploading without selecting files
- Verify error message appears (should be prevented by button state)
- If upload fails, verify error message is displayed
- Verify failed files show "Failed" status with red alert icon

### 7. Backend Verification
- Check Django admin: `/admin/candidates/candidate/`
- Verify new Candidate records are created
- Check `/admin/candidates/resume/`
- Verify Resume records are created with uploaded files
- Check `/admin/candidates/parsedresume/`
- Verify ParsedResume records are created with parsed data
- Verify all related models are populated:
  - Education records
  - Experience records
  - TechnicalSkill, SoftSkill records
  - Projects, Awards, Languages, Courses, Publications (if present in CV)

### 8. Database Verification
```python
# In Django shell or admin
from candidates.models import Candidate, Resume, ParsedResume

# Check latest candidates
candidates = Candidate.objects.all().order_by('-created_at')[:5]
for c in candidates:
    print(f"{c.name} - {c.email}")
    print(f"  Resumes: {c.resumes.count()}")
    for resume in c.resumes.all():
        if hasattr(resume, 'parsed_data'):
            print(f"    - {resume.file.name}: Parsed ✓")
            print(f"      Education: {resume.parsed_data.educations.count()}")
            print(f"      Experience: {resume.parsed_data.experiences.count()}")
            print(f"      Skills: {resume.parsed_data.technical_skills.count()}")
```

### 9. API Endpoint Test (Optional - using curl)
```bash
# Get auth token first
TOKEN="your_jwt_token_here"
JOB_ID=1

# Upload a file
curl -X POST http://localhost:8000/api/candidates/upload-cv/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/path/to/cv.pdf" \
  -F "job_id=$JOB_ID"
```

### 10. Concurrent Processing Test
- Upload 5-10 CV files simultaneously
- Verify all files are processed (may take 1-2 minutes)
- Verify progress updates correctly
- Check backend logs to verify threading is working
- Verify rate limiting is respected (max 3 concurrent requests)

## Expected Results

✅ All files upload successfully  
✅ No JavaScript errors in console  
✅ Files are stored in `media/resumes/` directory  
✅ Candidates are created in database  
✅ Resumes are parsed using AI service  
✅ All parsed data is stored in related models  
✅ Success/error messages display correctly  
✅ Status updates work in real-time  
✅ Navigation to processing page works (if batch_id exists)

## Common Issues & Solutions

### Issue: "No files provided" error
- **Solution:** Check browser console for errors
- Verify files are actual File objects (not plain objects)
- Check FormData is being created correctly

### Issue: "Right-hand side of 'instanceof' is not callable"
- **Solution:** Fixed by using property checks instead of instanceof

### Issue: Files not uploading
- **Solution:** 
  - Check authentication token is valid
  - Verify API endpoint is correct
  - Check backend logs for errors
  - Verify OpenRouter API key is set

### Issue: Parsing fails
- **Solution:**
  - Check OpenRouter API key and credits
  - Verify file format is supported
  - Check backend logs for AI service errors
  - Verify prompt template exists in `ai/prompts/parse_resume.md`

## Test Data

Use the test CV files from `ai/CV_files/`:
- `En-CV1.pdf`
- `Pe-CV2.pdf`

These files are known to work with the parsing service.

