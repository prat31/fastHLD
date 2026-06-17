import { describe, it, expect } from 'vitest';
import { getIcon, iconMap, FALLBACK_ICON } from '../../components/nodes/icons/iconRegistry';

describe('iconRegistry', () => {
  it('returns a component for every AWS type', () => {
    const awsTypes = Object.keys(iconMap).filter((k) => k.startsWith('aws_'));
    expect(awsTypes.length).toBeGreaterThanOrEqual(15);
    awsTypes.forEach((t) => expect(getIcon(t)).toBeDefined());
  });

  it('returns a component for every GCP type', () => {
    const gcpTypes = Object.keys(iconMap).filter((k) => k.startsWith('gcp_'));
    expect(gcpTypes.length).toBeGreaterThanOrEqual(9);
  });

  it('returns a component for every Azure type', () => {
    const azureTypes = Object.keys(iconMap).filter((k) => k.startsWith('azure_'));
    expect(azureTypes.length).toBeGreaterThanOrEqual(7);
  });

  it('returns a component for every OSS type', () => {
    const ossTypes = Object.keys(iconMap).filter((k) => k.startsWith('oss_'));
    expect(ossTypes.length).toBeGreaterThanOrEqual(12);
  });

  it('returns a component for every generic type', () => {
    const genericTypes = Object.keys(iconMap).filter((k) => k.startsWith('generic_'));
    expect(genericTypes.length).toBeGreaterThanOrEqual(10);
  });

  it('returns FALLBACK_ICON for unknown type', () => {
    expect(getIcon('totally_unknown_service')).toBe(FALLBACK_ICON);
  });

  it('each registered icon is a function', () => {
    Object.values(iconMap).forEach((Icon) => {
      expect(typeof Icon).toBe('function');
    });
  });
});
