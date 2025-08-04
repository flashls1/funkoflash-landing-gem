-- Clean existing hero text data and standardize field names
UPDATE site_design_settings 
SET settings = settings - 'hero' - 'backgroundImage' || 
    jsonb_build_object(
        'hero', jsonb_build_object(
            'backgroundMedia', COALESCE(settings->'hero'->>'backgroundMedia', settings->'hero'->>'backgroundImage'),
            'mediaType', COALESCE(settings->'hero'->>'mediaType', 'image'),
            'overlayOpacity', COALESCE(settings->'hero'->>'overlayOpacity', '0.5'),
            'height', COALESCE(settings->'hero'->>'height', '240')
        )
    )
WHERE settings ? 'hero';

-- Remove any existing hero title and subtitle text from all pages
UPDATE site_design_settings 
SET settings = jsonb_set(
    settings, 
    '{hero}', 
    (settings->'hero') - 'title' - 'subtitle'
)
WHERE settings->'hero' ? 'title' OR settings->'hero' ? 'subtitle';