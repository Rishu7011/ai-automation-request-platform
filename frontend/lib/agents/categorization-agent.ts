// Task 2.7 — Categorization Agent
// Classifies the automation request by type and identifies systems/departments touched.

import { callLlm, parseJsonSafe } from './llm-client';

export interface CategorizationResult {
  departmentTags: string[];
  automationType: string;
  systemsTouched: string[];
}

const AUTOMATION_TYPES = [
  'Data Entry Automation',
  'Report Generation',
  'Document Processing',
  'Workflow Routing & Approval',
  'System Integration / API Sync',
  'Notification & Alerting',
  'Data Extraction & Transformation',
  'Scheduling & Calendar Automation',
  'AI/ML Inference Pipeline',
  'Compliance & Audit Automation',
  'Customer Communication Automation',
  'HR Process Automation',
  'Financial Process Automation',
  'IT Operations Automation',
  'Other',
];

const SYSTEM_PROMPT = `You are a Categorization Agent for an internal AI automation request platform.

Your job is to classify an automation request into structured categories.

Available automation types (choose the single best match):
${AUTOMATION_TYPES.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Rules:
- departmentTags: List all departments that would benefit from or be affected by this automation (not just the requester's department).
- automationType: Pick the single best match from the list above.
- systemsTouched: List specific software systems, tools, or platforms mentioned or implied (e.g., "Salesforce", "SAP", "Excel", "Slack", "SharePoint").

Respond with ONLY a valid JSON object. No text, no markdown.

{
  "departmentTags": ["array of department names affected"],
  "automationType": "single automation type string from the list",
  "systemsTouched": ["array of specific system/tool names"]
}`;

/**
 * Run the Categorization Agent.
 */
export async function runCategorizationAgent({
  department,
  processDescription,
  toolsUsed,
  painPoints,
  desiredOutcome,
}: {
  department: string;
  processDescription?: string;
  toolsUsed?: string[];
  painPoints?: string[];
  desiredOutcome?: string;
}): Promise<CategorizationResult> {
  const userPrompt = `PRIMARY DEPARTMENT: ${department}

PROCESS DESCRIPTION:
${processDescription || 'Not provided.'}

TOOLS CURRENTLY USED:
${toolsUsed?.length ? toolsUsed.join(', ') : 'Not specified.'}

PAIN POINTS:
${painPoints?.length ? painPoints.map((p) => `- ${p}`).join('\n') : 'Not specified.'}

DESIRED OUTCOME:
${desiredOutcome || 'Not specified.'}

Categorize this automation request.`;

  const raw = await callLlm(SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);
  const parsed = parseJsonSafe<CategorizationResult>(raw);

  if (!parsed) {
    console.warn('[CategorizationAgent] Parse failed — returning minimal defaults');
    return {
      departmentTags: [department],
      automationType: 'Other',
      systemsTouched: [],
    };
  }

  // Ensure requesting department is always in tags
  if (!parsed.departmentTags.includes(department)) {
    parsed.departmentTags = [department, ...parsed.departmentTags];
  }

  return parsed;
}
