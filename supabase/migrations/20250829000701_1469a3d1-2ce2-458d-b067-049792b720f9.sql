-- Create global default background setting with the black background
INSERT INTO site_design_settings (page_name, settings)
VALUES (
  'global-default',
  '{
    "siteBackground": {
      "backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png",
      "position": {"x": 50, "y": 50},
      "scale": 100
    }
  }'::jsonb
)
ON CONFLICT (page_name) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = now();

-- Update all existing page settings to use the black background except admin
UPDATE site_design_settings 
SET settings = jsonb_set(
  settings,
  '{siteBackground}',
  '{
    "backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png",
    "position": {"x": 50, "y": 50},
    "scale": 100
  }'::jsonb
)
WHERE page_name != 'admin-dashboard';

-- Also create specific entries for all major page types
INSERT INTO site_design_settings (page_name, settings) VALUES
  ('home', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('shop', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('events', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('about', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('contact', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('talent-directory', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('auth', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('business-dashboard', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('talent-dashboard', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}'),
  ('staff-dashboard', '{"siteBackground": {"backgroundImage": "/lovable-uploads/eea7beb6-23d0-4f03-b0c2-aabe83f9df0c.png", "position": {"x": 50, "y": 50}, "scale": 100}}')
ON CONFLICT (page_name) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = now();