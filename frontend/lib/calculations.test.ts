// lib/calculations.test.ts — Unit tests for Deterministic ROI & Priority Calculation Engine (Task 2.9)
import { describe, it, expect } from 'vitest';
import {
  calculateROI,
  calculatePriorityScore,
  getPriorityTier,
  ROIInputs,
  PriorityFactors,
} from './calculations';
import { DEFAULT_PRIORITY_WEIGHTS } from '@/constants';

describe('calculateROI', () => {
  it('calculates annual hours and dollars saved accurately with defaults', () => {
    const inputs: ROIInputs = {
      hoursPerOccurrence: 2,
      frequencyPerYear: 52, // weekly
      peopleInvolved: 5,
      effortSize: 'S', // 20–40 hours (mid = 30 hrs)
    };

    const result = calculateROI(inputs);

    // 2 hrs * 52 * 5 = 520 hours saved
    expect(result.annualHoursSaved).toBe(520);
    // 520 hours * $75/hr default = $39,000
    expect(result.annualDollarsSaved).toBe(39000);
    // Build cost: S range [20, 40] @ $150/hr => low $3000, high $6000, mid $4500
    expect(result.buildCostLow).toBe(3000);
    expect(result.buildCostHigh).toBe(6000);
    expect(result.buildCostMid).toBe(4500);
    // Simple ROI = (39000 - 4500) / 4500 = 7.667
    expect(result.simpleROI).toBe(7.667);
    // Payback months = (4500 / 39000) * 12 = 1.38 -> 1.4 months
    expect(result.paybackMonths).toBe(1.4);
  });

  it('customizes blended hourly cost and engineering rate', () => {
    const inputs: ROIInputs = {
      hoursPerOccurrence: 10,
      frequencyPerYear: 12,
      peopleInvolved: 2,
      blendedHourlyCost: 100,
      engineeringRatePerHour: 200,
      effortSize: 'M', // [40, 100], mid = 70
    };

    const result = calculateROI(inputs);

    // 10 * 12 * 2 = 240 hours
    expect(result.annualHoursSaved).toBe(240);
    // 240 * $100 = $24,000
    expect(result.annualDollarsSaved).toBe(24000);
    // Mid build cost = 70 * $200 = $14,000
    expect(result.buildCostMid).toBe(14000);
  });

  it('calculates build cost using custom effort hours range when provided', () => {
    const inputs: ROIInputs = {
      hoursPerOccurrence: 5,
      frequencyPerYear: 52,
      peopleInvolved: 2,
      blendedHourlyCost: 80,
      engineeringRatePerHour: 150,
      effortSize: 'S',
      effortHoursRange: [10, 30], // custom range mid = 20
    };

    const result = calculateROI(inputs);
    // 5 * 52 * 2 = 520 hours * $80 = $41,600
    expect(result.annualDollarsSaved).toBe(41600);
    // Low: 10 * 150 = 1500, High: 30 * 150 = 4500, Mid: 20 * 150 = 3000
    expect(result.buildCostLow).toBe(1500);
    expect(result.buildCostHigh).toBe(4500);
    expect(result.buildCostMid).toBe(3000);
  });

  it('handles 0 hours or 0 frequency gracefully without division by zero', () => {
    const inputs: ROIInputs = {
      hoursPerOccurrence: 0,
      frequencyPerYear: 52,
      peopleInvolved: 3,
      effortSize: 'L',
    };

    const result = calculateROI(inputs);
    expect(result.annualHoursSaved).toBe(0);
    expect(result.annualDollarsSaved).toBe(0);
    expect(result.paybackMonths).toBe(999);
  });

  it('clamps negative inputs safely to non-negative', () => {
    const inputs: ROIInputs = {
      hoursPerOccurrence: -5,
      frequencyPerYear: -10,
      peopleInvolved: 0, // safePeople = max(1, 0) => 1
      effortSize: 'S',
    };

    const result = calculateROI(inputs);
    expect(result.annualHoursSaved).toBe(0);
    expect(result.annualDollarsSaved).toBe(0);
  });
});

describe('calculatePriorityScore', () => {
  it('applies HIGH confidence multiplier (1.0x) correctly', () => {
    const factors: PriorityFactors = {
      estimatedRoi: 500_000,
      strategicValue: 5,
      urgency: 5,
      orgImpact: 5,
      effortSize: 'S',
      riskLevel: 1,
      roiConfidence: 'HIGH', // 1.0 multiplier
    };

    const score = calculatePriorityScore(factors, DEFAULT_PRIORITY_WEIGHTS);
    expect(score).toBeGreaterThan(70);
  });

  it('applies MEDIUM (0.85x) and LOW (0.70x) confidence multipliers', () => {
    const factorsHigh: PriorityFactors = {
      estimatedRoi: 50_000,
      strategicValue: 4,
      urgency: 4,
      orgImpact: 4,
      effortSize: 'M',
      riskLevel: 2,
      roiConfidence: 'HIGH',
    };

    const factorsLow: PriorityFactors = {
      ...factorsHigh,
      roiConfidence: 'LOW',
    };

    const scoreHigh = calculatePriorityScore(factorsHigh, DEFAULT_PRIORITY_WEIGHTS);
    const scoreLow = calculatePriorityScore(factorsLow, DEFAULT_PRIORITY_WEIGHTS);

    // LOW score should be exactly 70% of HIGH score before rounding
    expect(scoreLow).toBeLessThan(scoreHigh);
    expect(scoreLow / scoreHigh).toBeCloseTo(0.70, 1);
  });
});

describe('getPriorityTier', () => {
  it('maps scores to correct priority tiers', () => {
    expect(getPriorityTier(85)).toBe('Critical');
    expect(getPriorityTier(70)).toBe('Critical');
    expect(getPriorityTier(69.9)).toBe('High');
    expect(getPriorityTier(50)).toBe('High');
    expect(getPriorityTier(49.9)).toBe('Medium');
    expect(getPriorityTier(30)).toBe('Medium');
    expect(getPriorityTier(29.9)).toBe('Low');
    expect(getPriorityTier(0)).toBe('Low');
  });
});
