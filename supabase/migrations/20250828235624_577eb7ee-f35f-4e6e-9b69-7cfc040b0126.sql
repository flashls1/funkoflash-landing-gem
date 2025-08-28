-- Create site design settings for business events page with black background
INSERT INTO site_design_settings (page_name, settings, updated_by) 
VALUES (
  'business-events',
  '{
    "siteBackground": {
      "backgroundImage": "src/assets/business-events-background.png",
      "position": {"x": 50, "y": 50},
      "scale": 100
    },
    "hero": {
      "backgroundMedia": "src/assets/business-events-background.png",
      "mediaType": "image",
      "overlayOpacity": 0.45,
      "height": "240",
      "position": {"x": 50, "y": 50},
      "scale": 100
    }
  }'::jsonb,
  (SELECT auth.uid())
)
ON CONFLICT (page_name) 
DO UPDATE SET 
  settings = EXCLUDED.settings,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();