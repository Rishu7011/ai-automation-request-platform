// Core system constants and default configurations for the AI Automation Platform

export const CONFIDENCE_MULTIPLIERS = {
  HIGH: 1.00,
  MEDIUM: 0.85,
  LOW: 0.70,
} as const;

export type ConfidenceLevel = keyof typeof CONFIDENCE_MULTIPLIERS;

export const DEFAULT_EFFORT_HOURS = {
  S: [20, 40],
  M: [40, 100],
  L: [100, 250],
  XL: [250, 500],
} as const;

export type EffortSize = keyof typeof DEFAULT_EFFORT_HOURS;

export const DEFAULT_PRIORITY_WEIGHTS = {
  weightRoi: 0.35,
  weightStrategicValue: 0.15,
  weightUrgency: 0.15,
  weightOrgImpact: 0.10,
  weightEffort: 0.15,
  weightRisk: 0.10,
} as const;

export const DEPARTMENTS = [
  'Recruitment',
  'HR',
  'Finance',
  'Compliance',
  'IT',
  'Operations',
  'Engineering',
  'Legal',
  'Sales',
  'Marketing',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEFAULT_BLENDED_HOURLY_RATE = 75; // $75/hr default unless overridden per department

export const INTAKE_STAGES = [
  { id: 1, name: 'Business Problem', icon: '🏢' },
  { id: 2, name: 'Current Workflow', icon: '🔄' },
  { id: 3, name: 'Existing Tools', icon: '🛠️' },
  { id: 4, name: 'Pain Points', icon: '🚧' },
  { id: 5, name: 'Metrics', icon: '📈' },
  { id: 6, name: 'ROI Inputs', icon: '💰' },
  { id: 7, name: 'Compliance & Security', icon: '🛡️' },
  { id: 8, name: 'Review & Confirmation', icon: '✅' },
] as const;

export const REQUEST_STATUSES = [
  'draft',
  'ai_reviewing',
  'submitted',
  'needs_more_info',
  'engineering_review',
  'approved',
  'rejected',
  'planned',
  'in_development',
  'testing',
  'completed',
  'archived',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const USER_ROLES = [
  'requester',
  'dept_reviewer',
  'eng_admin',
  'sys_admin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = [
  'active',
  'pending_approval',
  'deactivated',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];
