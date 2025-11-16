<!-- adf78311-7d87-4cbd-ba18-a0e4a03beb0b ac3599bd-c624-43c3-8421-4adc6310cbe5 -->
# Simplify Backend to Match Test Service Structure

## Analysis

Comparing `test_service.py` and `backend/processing/services.py`:

### test_service.py structure:

- ✅ Simple, direct call to `process_file_with_prompt`
- ✅ `extract_text=None` (auto-detect) - not explicitly set
- ✅ Parameters: `temperature=0.7`, `max_tokens=4000`, `response_format={"type": "json_object"}`
- ✅ Clean error handling without complex fallback logic
- ✅ No manual text extraction before calling AI service

### Current backend/processing/services.py:

- ✅ Uses `process_file_with_prompt` with same parameters
- ✅ Has `extract_text=None` (already matches)
- ❌ Complex fallback to old method (OpenRouterClient.parse_resume)
- ❌ Manual text extraction before AI service call
- ❌ Overly complex error handling with double-wrapping prevention

## Changes Needed

1. **Simplify parse_resume_service** to match test_service.py structure:

- Remove manual text extraction (let AI service handle it via auto-detect)
- Simplify error handling (let AI service handle errors internally)
- Remove or simplify fallback to old method (or make it cleaner)

2. **Ensure consistency**:

- Same parameter values as test_service.py
- Same error handling approach
- Same file processing flow

## Files to Modify

- `backend/processing/services.py`: Simplify `parse_resume_service` function

## Implementation Steps

1. Remove manual text extraction - let `process_file_with_prompt` handle it
2. Simplify error handling to match test_service.py approach
3. Keep fallback to old method but make it simpler and clearer
4. Ensure all parameters match test_service.py exactly

### To-dos

- [ ] Remove manual text extraction in parse_resume_service - let process_file_with_prompt handle it via auto-detect
- [ ] Simplify error handling to match test_service.py structure - cleaner exception handlin
- [ ] Ensure all parameters (temperature, max_tokens, response_format, extract_text) exactly match test_service.py
- [ ] Clean up fallback to old method - make it simpler and clearer