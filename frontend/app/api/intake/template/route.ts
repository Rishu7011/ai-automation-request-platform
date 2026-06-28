// /api/intake/template — fetch IntakeTemplateConfig for a department + stage
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { IntakeTemplateConfig } from '@/models/IntakeTemplateConfig';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const department = searchParams.get('department');
  const stage = searchParams.get('stage');

  if (!department) {
    return NextResponse.json({ error: 'department is required' }, { status: 400 });
  }

  await connectToDatabase();

  const filter: Record<string, unknown> = { department };
  if (stage) {
    filter.stage = parseInt(stage, 10);
  }

  const configs = await IntakeTemplateConfig.find(filter).sort({ stage: 1 }).lean();

  return NextResponse.json({ configs });
}
