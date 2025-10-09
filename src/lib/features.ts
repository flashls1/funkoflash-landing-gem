// Feature flags configuration
export const FEATURES = {
  calendar: true,  // Calendar Management module
  googleSync: false,  // Google Calendar sync (coming soon)
  calendarForBusiness: true,  // Calendar access for Business role (config-only)
  businessEvents: true,  // Business Events module
  appearance: true,  // Appearance controls with ripple effects
  profile_module_update: true,  // New Profile module (replaces Settings)
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const hasFeature = (feature: FeatureFlag): boolean => {
  return FEATURES[feature] === true;
};