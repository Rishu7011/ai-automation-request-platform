// Task 2.9 — Deterministic ROI & Priority Calculation Engine
// Pure TypeScript — no LLM calls. All formulas are deterministic and unit-testable.

import {
  CONFIDENCE_MULTIPLIERS,
  DEFAULT_EFFORT_HOURS,
  DEFAULT_PRIORITY_WEIGHTS,
  DEFAULT_BLENDED_HOURLY_RATE,
  EffortSize,
  ConfidenceLevel,
} from '@/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ROIInputs {
  hoursPerOccurrence: number;
  frequencyPerYear: number;
  peopleInvolved: number;
  blendedHourlyCost?: number;    // $/hr — defaults to DEFAULT_BLENDED_HOURLY_RATE
  effortSize: EffortSize;
  engineeringRatePerHour?: number; // $/hr — defaults to 150
}

export interface ROIResult {
  annualHoursSaved: number;
  annualDollarsSaved: number;
  buildCostLow: number;
  buildCostHigh: number;
  buildCostMid: number;         // midpoint used in ROI ratio
  simpleROI: number;            // (annualDollarsSaved - buildCostMid) / buildCostMid
  paybackMonths: number;        // months to recover build cost
}

export interface PriorityFactors {
  estimatedRoi: number;        // normalised 0–1 (we normalise annualDollarsSaved)
  strategicValue: number;      // 1–5
  urgency: number;             // 1–5
  orgImpact: number;           // 1–5
  effortSize: EffortSize;
  riskLevel: number;           // 1–5
  roiConfidence: ConfidenceLevel;
}

export interface PriorityWeights {
  weightRoi: number;
  weightStrategicValue: number;
  weightUrgency: number;
  weightOrgImpact: number;
  weightEffort: number;
  weightRisk: number;
}

// ─── ROI Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate ROI figures from raw inputs.
 *
 * Formula:
 *   Annual Hours Saved = hoursPerOccurrence × frequencyPerYear × peopleInvolved
 *   Annual $ Saved     = Annual Hours Saved × blendedHourlyCost
 *   Build Cost         = effortHoursRange × engineeringRatePerHour
 *   Simple ROI         = (Annual $ Saved − Build Cost Mid) / Build Cost Mid
 *   Payback Months     = (Build Cost Mid / Annual $ Saved) × 12
 */
export function calculateROI(inputs: ROIInputs): ROIResult {
  const {
    hoursPerOccurrence,
    frequencyPerYear,
    peopleInvolved,
    blendedHourlyCost = DEFAULT_BLENDED_HOURLY_RATE,
    effortSize,
    engineeringRatePerHour = 150,
  } = inputs;

  // Clamp inputs to sane ranges
  const safeHours = Math.max(0, hoursPerOccurrence);
  const safeFreq = Math.max(0, frequencyPerYear);
  const safePeople = Math.max(1, peopleInvolved);
  const safeHourlyCost = Math.max(0, blendedHourlyCost);
  const safeEngRate = Math.max(0, engineeringRatePerHour);

  const annualHoursSaved = safeHours * safeFreq * safePeople;
  const annualDollarsSaved = annualHoursSaved * safeHourlyCost;

  const [effortLow, effortHigh] = DEFAULT_EFFORT_HOURS[effortSize];
  const buildCostLow = effortLow * safeEngRate;
  const buildCostHigh = effortHigh * safeEngRate;
  const buildCostMid = ((effortLow + effortHigh) / 2) * safeEngRate;

  const simpleROI =
    buildCostMid > 0 ? (annualDollarsSaved - buildCostMid) / buildCostMid : 0;

  const paybackMonths =
    annualDollarsSaved > 0 ? (buildCostMid / annualDollarsSaved) * 12 : Infinity;

  return {
    annualHoursSaved: Math.round(annualHoursSaved * 100) / 100,
    annualDollarsSaved: Math.round(annualDollarsSaved * 100) / 100,
    buildCostLow: Math.round(buildCostLow),
    buildCostHigh: Math.round(buildCostHigh),
    buildCostMid: Math.round(buildCostMid),
    simpleROI: Math.round(simpleROI * 1000) / 1000,
    paybackMonths: isFinite(paybackMonths) ? Math.round(paybackMonths * 10) / 10 : 999,
  };
}

// ─── Priority Score Calculation ───────────────────────────────────────────────

// Effort size → 0–1 cost score (higher effort = higher cost = lower priority)
const EFFORT_COST_MAP: Record<EffortSize, number> = {
  S: 0.1,
  M: 0.4,
  L: 0.7,
  XL: 1.0,
};

// Normalise dollar savings to 0–1 using a soft cap of $500K/yr
const ROI_SOFT_CAP = 500_000;

function normaliseRoi(annualDollarsSaved: number): number {
  if (annualDollarsSaved <= 0) return 0;
  // Use log scale so $10K and $1M don't collapse everything else
  const log = Math.log10(Math.min(annualDollarsSaved, ROI_SOFT_CAP) + 1);
  const logCap = Math.log10(ROI_SOFT_CAP + 1);
  return log / logCap;
}

function normalise1to5(value: number): number {
  return Math.max(0, Math.min(1, (value - 1) / 4));
}

/**
 * Calculate the multi-factor priority score (0–100).
 *
 * Formula:
 *   Score = (W1 × ROI_norm + W2 × StrategicValue_norm + W3 × Urgency_norm + W4 × OrgImpact_norm
 *           − W5 × EffortCost − W6 × Risk_norm) × ConfidenceMultiplier × 100
 *
 * The confidence multiplier caps the score based on estimate quality.
 */
export function calculatePriorityScore(
  factors: PriorityFactors,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): number {
  const roiNorm = normaliseRoi(factors.estimatedRoi);
  const strategicNorm = normalise1to5(factors.strategicValue);
  const urgencyNorm = normalise1to5(factors.urgency);
  const orgImpactNorm = normalise1to5(factors.orgImpact);
  const effortCost = EFFORT_COST_MAP[factors.effortSize] ?? 0.4;
  const riskNorm = normalise1to5(factors.riskLevel);

  const confidenceMultiplier = CONFIDENCE_MULTIPLIERS[factors.roiConfidence];

  const rawScore =
    weights.weightRoi * roiNorm +
    weights.weightStrategicValue * strategicNorm +
    weights.weightUrgency * urgencyNorm +
    weights.weightOrgImpact * orgImpactNorm -
    weights.weightEffort * effortCost -
    weights.weightRisk * riskNorm;

  // Clamp to [0, 1] before applying confidence and scaling
  const clamped = Math.max(0, Math.min(1, rawScore));
  const score = clamped * confidenceMultiplier * 100;

  return Math.round(score * 10) / 10;
}

// ─── Priority Tier ────────────────────────────────────────────────────────────

export type PriorityTier = 'Critical' | 'High' | 'Medium' | 'Low';

export function getPriorityTier(score: number): PriorityTier {
  if (score >= 70) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}
