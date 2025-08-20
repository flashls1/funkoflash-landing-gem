// Feature flags configuration
export const FEATURES = {
  calendar: true,  // Calendar Management module
  googleSync: false,  // Google Calendar sync (coming soon)
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const hasFeature = (feature: FeatureFlag): boolean => {
  return FEATURES[feature] === true;
};