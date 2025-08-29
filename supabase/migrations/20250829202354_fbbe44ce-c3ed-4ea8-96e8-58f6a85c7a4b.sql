-- Clean up artificial site design settings created during black background override
-- Remove global-default entry (artificial)
DELETE FROM site_design_settings WHERE page_name = 'global-default';

-- Remove siteBackground from dashboard pages that should use dynamic system
UPDATE site_design_settings 
SET settings = settings - 'siteBackground'
WHERE page_name IN ('auth', 'business-dashboard', 'staff-dashboard', 'talent-dashboard')
AND settings ? 'siteBackground';

-- Keep business-events siteBackground as it might be legitimate
-- Keep hero settings for all public pages intact