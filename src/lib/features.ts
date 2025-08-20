// Feature flags configuration
export const FEATURES = {
  calendar: true,  // Calendar Management module
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const hasFeature = (feature: FeatureFlag): boolean => {
  return FEATURES[feature] === true;
};