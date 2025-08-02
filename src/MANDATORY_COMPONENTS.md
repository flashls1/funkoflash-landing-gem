# Mandatory Components for All Pages

## Required Components for Every Page

Every page in this application MUST include these three components:

1. **Navigation Bar** - `<Navigation language={language} setLanguage={setLanguage} />`
2. **Footer** - `<Footer language={language} />`
3. **Landing Page Background** - Applied via the following style:

```tsx
<div 
  className="min-h-screen bg-background"
  style={{
    backgroundImage: 'var(--site-background)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  }}
>
```

## Using the PageLayout Component

For consistency and ease of maintenance, use the `PageLayout` component wrapper:

```tsx
import PageLayout from '@/components/PageLayout';

const MyPage = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  
  return (
    <PageLayout language={language} setLanguage={setLanguage}>
      {/* Your page content here */}
    </PageLayout>
  );
};
```

## Language Support

Every page must support both English ('en') and Spanish ('es') languages and include:
- `const [language, setLanguage] = useState<'en' | 'es'>('en');`
- Pass language props to Navigation and Footer components

## Current Pages Updated

All the following pages have been updated to include mandatory components:

✅ Index.tsx (Landing page)
✅ About.tsx
✅ Auth.tsx
✅ Contact.tsx
✅ Events.tsx
✅ EventsManager.tsx
✅ Shop.tsx
✅ ShopManager.tsx
✅ TalentDirectory.tsx
✅ TalentDirectoryCMS.tsx
✅ TalentProfile.tsx
✅ AdminDashboard.tsx
✅ StaffDashboard.tsx
✅ TalentDashboard.tsx
✅ SiteDesignModule.tsx
✅ NotFound.tsx

## Creating New Pages

When creating new pages, either:

1. Use the `PageLayout` component (recommended)
2. Or manually include all three mandatory components following the pattern above

## Background Variable

The background is controlled by the CSS variable `--site-background` which is managed through the site design settings and applied globally across all pages.