import fs from 'fs';
import path from 'path';

// Load .env file from the project root (works whether running from /scripts or /)
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import {
  DEPARTMENTS,
  DEFAULT_PRIORITY_WEIGHTS,
  DEFAULT_EFFORT_HOURS,
  DEFAULT_BLENDED_HOURLY_RATE,
} from '../constants';
import User from '../models/User';
import PriorityWeightsConfig from '../models/PriorityWeightsConfig';
import SystemSettings from '../models/SystemSettings';
import IntakeTemplateConfig from '../models/IntakeTemplateConfig';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-automation';
const INITIAL_ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'admin@internal.com';
const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPass123!';

async function seed() {
  console.log('🌱 Starting database seed script...');
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);

  // 1. Seed System Settings (Effort Ranges & Blended Rates)
  console.log('📦 Seeding SystemSettings...');
  await SystemSettings.findOneAndUpdate(
    { key: 'effortRanges' },
    { key: 'effortRanges', value: DEFAULT_EFFORT_HOURS },
    { upsert: true, new: true }
  );

  const defaultRates: Record<string, number> = {};
  DEPARTMENTS.forEach((dept) => {
    defaultRates[dept] = DEFAULT_BLENDED_HOURLY_RATE;
  });

  await SystemSettings.findOneAndUpdate(
    { key: 'blendedRates' },
    { key: 'blendedRates', value: defaultRates },
    { upsert: true, new: true }
  );

  // 2. Seed Priority Weights Config
  console.log('⚖️ Seeding PriorityWeightsConfig...');
  const existingWeights = await PriorityWeightsConfig.findOne();
  if (!existingWeights) {
    await PriorityWeightsConfig.create(DEFAULT_PRIORITY_WEIGHTS);
  }

  // 3. Seed Intake Templates for all 10 departments
  console.log('📄 Seeding IntakeTemplateConfig for all departments...');
  const departmentFocus: Record<string, string> = {
    Recruitment: 'Candidate sourcing, resume screening, scheduling, and ATS workflows',
    HR: 'Onboarding, offboarding, policy inquiries, and HRIS data reconciliation',
    Finance: 'Invoice matching, expense reconciliation, reporting, and ERP entry',
    Compliance: 'Regulatory tracking, audit prep, document verification, and filing deadlines',
    IT: 'Access management, ticket triage, password resets, and system provisioning',
    Operations: 'SLA monitoring, vendor tracking, process handoffs, and logistics management',
    Engineering: 'CI/CD pipelines, internal dev tools, issue triage, and documentation',
    Legal: 'Contract intake, clause extraction, NDA reviews, and signature tracking',
    Sales: 'Lead enrichment, CRM data updates, quote generation, and deal alerts',
    Marketing: 'Campaign asset approval, social scheduling, analytics rollups, and copy review',
  };

  for (const dept of DEPARTMENTS) {
    const focus = departmentFocus[dept] || 'General departmental processes';
    for (let stage = 1; stage <= 8; stage++) {
      await IntakeTemplateConfig.findOneAndUpdate(
        { department: dept, stage },
        {
          department: dept,
          stage,
          questionSet: [
            {
              key: `stage_${stage}_q1`,
              prompt: `Describe the ${dept} process requirements for Stage ${stage}. Focus area: ${focus}`,
              focusArea: focus,
            },
          ],
        },
        { upsert: true, new: true }
      );
    }
  }

  // 4. Seed Initial System Admin User
  console.log(`👑 Seeding System Admin account (${INITIAL_ADMIN_EMAIL})...`);
  const passwordHash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email: INITIAL_ADMIN_EMAIL },
    {
      name: 'System Admin',
      email: INITIAL_ADMIN_EMAIL,
      username: 'sysadmin',
      passwordHash,
      department: 'Engineering',
      role: 'sys_admin',
      status: 'active',
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
