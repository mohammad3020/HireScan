# CV Processing Logging Guide

## Log File Locations

**Timing logs** (CV upload and processing times) are written to:
```
backend/logs/timing.log
```

**General application logs** are written to:
```
backend/logs/hirescan.log
```

## Viewing Timing Logs

### Real-time monitoring (recommended)
```bash
# Watch timing logs in real-time
tail -f backend/logs/timing.log

# Watch timing logs for a specific file item
tail -f backend/logs/timing.log | grep "file item 123"
```

### View recent timing logs
```bash
# Last 100 lines
tail -n 100 backend/logs/timing.log

# Last 50 lines
tail -n 50 backend/logs/timing.log
```

### Search timing logs
```bash
# Search for a specific batch
grep "batch 123" backend/logs/timing.log

# Search for AI processing times
grep "AI processing" backend/logs/timing.log

# Search for upload times
grep "upload" backend/logs/timing.log

# Search for PDF extraction times
grep "PDF text extraction" backend/logs/timing.log
```

## Log Format

All timing logs are prefixed with `[TIMING]` for easy filtering. The logs include:

### 1. File Upload Timing
- Individual file upload time
- Total batch upload time
- File size information

Example:
```
INFO [TIMING] Starting file upload for batch 1 - 3 file(s)
INFO [TIMING] File 'resume.pdf' (245.3 KB) uploaded in 0.15 seconds (150ms) - FileItem ID: 123
INFO [TIMING] Total upload completed in 0.45 seconds (450ms) for 3 file(s) in batch 1
```

### 2. PDF/DOCX Text Extraction Timing
- Time to extract text using pypdf or python-docx
- Number of characters extracted

Example:
```
INFO [TIMING] Starting PDF text extraction: /path/to/resume.pdf
INFO [TIMING] PDF text extraction completed in 0.23 seconds (230ms) - Extracted 5234 characters
```

### 3. AI Processing Timing
- Time for OpenRouter API to process the CV
- Includes rate limiting delays

Example:
```
INFO [TIMING] Starting AI processing with OpenRouter API...
INFO [TIMING] AI processing completed in 3.45 seconds (3450ms)
```

### 4. Total Processing Time
- Complete time from start to finish for each CV
- Includes all steps: upload, extraction, AI processing, database operations

Example:
```
INFO [TIMING] Starting processing for file item 123: resume.pdf
INFO [TIMING] Starting resume parsing for: /path/to/resume.pdf
INFO [TIMING] Total resume parsing completed in 4.12 seconds (4120ms) for resume 456
INFO [TIMING] Successfully processed file item 123 in 4.35 seconds (4350ms)
```

## Log Levels

- **INFO**: Normal operations and timing information
- **ERROR**: Errors during processing
- **WARNING**: Warnings (e.g., rate limiting, long prompts)

## Log Rotation

The log file will grow over time. To manage it:

```bash
# Archive old logs (optional)
mv backend/logs/hirescan.log backend/logs/hirescan.log.old

# Or use logrotate (Linux/Mac)
# Create /etc/logrotate.d/hirescan:
# /path/to/HireScan/backend/logs/hirescan.log {
#     daily
#     rotate 7
#     compress
#     missingok
#     notifempty
# }
```

## Console Output

Logs are also printed to the console (terminal) where Django is running, so you can see them in real-time during development.

## Example Complete Log Flow

```
INFO [TIMING] Starting file upload for batch 1 - 1 file(s)
INFO [TIMING] File 'John_Doe_CV.pdf' (312.5 KB) uploaded in 0.18 seconds (180ms) - FileItem ID: 1
INFO [TIMING] Total upload completed in 0.18 seconds (180ms) for 1 file(s) in batch 1
INFO [TIMING] Starting processing for file item 1: John_Doe_CV.pdf
INFO [TIMING] Starting resume parsing for: /path/to/media/resumes/John_Doe_CV.pdf
INFO [TIMING] Starting PDF text extraction: /path/to/media/resumes/John_Doe_CV.pdf
INFO [TIMING] PDF text extraction completed in 0.25 seconds (250ms) - Extracted 6789 characters
INFO [TIMING] Starting AI processing with OpenRouter API...
INFO [TIMING] AI processing completed in 2.87 seconds (2870ms)
INFO [TIMING] Total resume parsing completed in 3.15 seconds (3150ms) for resume 1
INFO [TIMING] Successfully processed file item 1 in 3.42 seconds (3420ms)
```

## Troubleshooting

If logs are not appearing:

1. Check that the `logs` directory exists and is writable:
   ```bash
   ls -la backend/logs/
   chmod 755 backend/logs/
   ```

2. Check Django settings for logging configuration in `backend/hirescan/settings.py`

3. Verify the log file is being created:
   ```bash
   ls -lh backend/logs/hirescan.log
   ```

4. Check file permissions:
   ```bash
   touch backend/logs/hirescan.log
   chmod 644 backend/logs/hirescan.log
   ```

