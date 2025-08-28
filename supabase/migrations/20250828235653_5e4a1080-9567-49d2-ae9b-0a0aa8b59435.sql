-- Update site design settings for business events page with black background
UPDATE site_design_settings 
SET settings = jsonb_set(
  settings,
  '{siteBackground}',
  '{
    "backgroundImage": "src/assets/business-events-background.png",
    "position": {"x": 50, "y": 50},
    "scale": 100
  }'::jsonb
)
WHERE page_name = 'business-events';