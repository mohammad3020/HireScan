# API Connection Status Report

## ✅ WORKING APIs

### 1. Jobs API - FULLY CONNECTED
- **List**: ✅ `Jobs.tsx` uses `useJobs()`
- **Detail**: ✅ `JobForm.tsx` and `JobProfile.tsx` use `useJob(id)`
- **Create**: ✅ `JobForm.tsx` uses `useCreateJob()`
- **Update**: ✅ `JobForm.tsx` uses `useUpdateJob()`
- **Delete**: ✅ `Jobs.tsx` uses `useDeleteJob()`

**Backend Endpoints:**
- `GET /api/jobs/jobs/` - List jobs
- `GET /api/jobs/jobs/{id}/` - Get job detail
- `POST /api/jobs/jobs/new/` - Create job
- `PATCH /api/jobs/jobs/{id}/` - Update job
- `DELETE /api/jobs/jobs/{id}/` - Delete job

---

## ❌ NOT CONNECTED APIs

### 2. Candidates API - NOT CONNECTED
**Status**: Pages using mock data instead of API

**Frontend API Functions Available:**
- `useCandidates()` - List candidates
- `useCandidate(id)` - Get candidate detail
- `useAddNote()` - Add note to candidate

**Pages Using Mock Data:**
- ❌ `CandidateDetail.tsx` - Uses `mockCandidate`
- ❌ `Review.tsx` - Uses `mockCandidates`

**Backend Endpoints Available:**
- `GET /api/candidates/candidates/` - List candidates
- `GET /api/candidates/candidates/{id}/detail/` - Get candidate detail
- `POST /api/candidates/candidates/{id}/add_note/` - Add note

---

### 3. Batch/Upload API - NOT CONNECTED
**Status**: Pages using mock data instead of API

**Frontend API Functions Available:**
- `useBatchUploads()` - List batches
- `useBatchUpload(id)` - Get batch detail
- `useCreateBatch()` - Create batch
- `useUploadFiles()` - Upload files to batch
- `useBatchStatus(id)` - Get batch status

**Pages Using Mock Data:**
- ❌ `Upload.tsx` - Uses mock upload logic
- ❌ `Processing.tsx` - Likely using mock data

**Backend Endpoints Available:**
- `GET /api/batch/batches/` - List batches
- `GET /api/batch/batches/{id}/` - Get batch detail
- `POST /api/batch/batches/` - Create batch
- `POST /api/batch/batches/{id}/upload_files/` - Upload files
- `GET /api/batch/batches/{id}/status/` - Get batch status

---

### 4. Review API - NOT CONNECTED
**Status**: Pages using mock data instead of API

**Frontend API Functions Available:**
- `useReviewDashboard(jobId)` - Get review dashboard data
- `useRefreshRanking()` - Refresh candidate ranking

**Pages Using Mock Data:**
- ❌ `Review.tsx` - Uses `mockCandidates` and `mockJobs`

**Backend Endpoints Available:**
- `GET /api/review/review/?jobId={id}` - Get review dashboard
- `POST /api/review/ranking/{job_id}/refresh/` - Refresh ranking

---

## Summary

**Total APIs**: 4
**Fully Connected**: 1 (Jobs)
**Partially Connected**: 0
**Not Connected**: 3 (Candidates, Batch/Upload, Review)

**Action Required**: Connect the 3 remaining APIs to their respective pages.

