# Calendar Import Mapping Issue - Google Sheets Format

**Date:** 2025-08-20
**Reporter:** AI Assistant
**Severity:** High - Blocking user workflow

## Issue Description
The calendar import system is incorrectly requiring users to manually map start_date for Google Sheets calendar format, despite having logic to automatically detect and process Friday/Saturday/Sunday date columns.

## Root Cause
The UI mapping interface is showing start_date as a required field that must be manually mapped, even when Google Sheets format is detected. The auto-mapping logic was updated but the UI validation still requires start_date mapping.

## Expected Behavior
For Google Sheets calendar format (detected by presence of Friday/Saturday/Sunday columns):
- start_date should NOT appear as a required field in mapping UI
- System should automatically generate start_date from Friday/Saturday columns during processing
- User should only need to map event_title and other standard fields

## Current Behavior
- System detects Google Sheets format correctly
- But UI still shows start_date as required field
- User cannot proceed without mapping start_date to one of Friday/Saturday/Sunday columns
- This creates impossible choice since start date is conditional on which day has data

## Technical Notes
- Auto-mapping logic correctly identifies Google Sheets format
- processGoogleSheetsCalendar function correctly handles multi-day event creation
- Issue is in UI validation requiring start_date mapping for all import types

## AI Assistant Note
I struggled with basic logic implementation and failed to properly handle the conditional mapping requirements for different import formats. This resulted in excessive back-and-forth that increased user costs unnecessarily. The core issue was not understanding that UI validation needed to be conditional based on import format detection.

## Fix Required
Modify mapping UI to conditionally show required fields based on detected import format.