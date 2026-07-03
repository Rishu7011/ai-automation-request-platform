// Server-side helper to fetch and parse SystemSettings (effortRanges & blendedRates)
import connectToDatabase from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import { EffortSize, DEFAULT_EFFORT_HOURS, DEFAULT_BLENDED_HOURLY_RATE } from '@/constants';

export async function getSystemSettingsConfig() {
  await connectToDatabase();
  const [effortSetting, ratesSetting] = await Promise.all([
    SystemSettings.findOne({ key: 'effortRanges' }).lean(),
    SystemSettings.findOne({ key: 'blendedRates' }).lean(),
  ]);

  const effortRanges = (effortSetting?.value as Record<EffortSize, { min: number; max: number }>) ?? null;
  const blendedRates = (ratesSetting?.value as Record<string, number>) ?? null;

  return {
    getEffortRange(size: EffortSize): [number, number] {
      if (effortRanges && effortRanges[size]) {
        const { min, max } = effortRanges[size];
        if (typeof min === 'number' && typeof max === 'number') {
          return [min, max];
        }
      }
      const fallback = DEFAULT_EFFORT_HOURS[size] ?? [40, 100];
      return [fallback[0], fallback[1]];
    },

    getBlendedRate(department: string): number {
      if (blendedRates && typeof blendedRates[department] === 'number') {
        return blendedRates[department];
      }
      return DEFAULT_BLENDED_HOURLY_RATE;
    },
  };
}
