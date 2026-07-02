// /api/intake/chat — AI Intake Agent endpoint (Task 2.3)
// Accepts a user message, calls Claude via the intake agent, saves both turns
// to RequestConversation, returns the AI response.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestConversation } from '@/models/RequestConversation';
import { IntakeTemplateConfig } from '@/models/IntakeTemplateConfig';
import { runIntakeAgent, generateStageOpener } from '@/lib/agents/intake-agent';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    requestId,
    stage,
    message,          // user message; null/undefined for stage openers
    slotFillState,    // current accumulated slot-fill JSON
    isStageOpener,    // true when frontend is requesting the opening question for a new stage
  } = body as {
    requestId: string;
    stage: number;
    message?: string;
    slotFillState: Record<string, unknown>;
    isStageOpener?: boolean;
  };

  if (!requestId || !stage) {
    return NextResponse.json({ error: 'requestId and stage are required' }, { status: 400 });
  }

  await connectToDatabase();

  // Verify the request belongs to this user or user is an admin
  const request = await Request.findById(requestId);
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  const role = (session.user as unknown as { role?: string })?.role;
  const isRequester = request.requesterId.toString() === session.user.id;
  const isAdmin = role === 'eng_admin' || role === 'sys_admin';

  if (!isRequester && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const department = request.department;

  // --- Stage opener (no user message yet) ---
  if (isStageOpener) {
    const openerText = (await generateStageOpener({ stage, department, slotFillState })).trim();
    const finalOpener = openerText || 'Let us move forward with this section.';

    await RequestConversation.create({
      requestId,
      stage,
      sender: 'ai',
      agentName: 'AI Intake Agent',
      message: finalOpener,
      timestamp: new Date(),
    });

    return NextResponse.json({
      aiMessage: finalOpener,
      stage_complete: false,
      slot_fill_update: {},
    });
  }

  // --- Regular turn ---
  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'message is required for a regular turn' }, { status: 400 });
  }

  // Save user turn
  await RequestConversation.create({
    requestId,
    stage,
    sender: 'user',
    message: message.trim(),
    timestamp: new Date(),
  });

  // Load full conversation history for this request (all stages) for context
  const allTurns = await RequestConversation.find({ requestId })
    .sort({ timestamp: 1 })
    .lean();

  const conversationHistory = allTurns.map((t) => ({
    role: t.sender === 'user' ? ('user' as const) : ('assistant' as const),
    content: t.message,
  }));

  // Load department-specific question templates for this stage
  const templateConfig = await IntakeTemplateConfig.findOne({
    department,
    stage,
  }).lean();

  const departmentQuestions = templateConfig?.questionSet ?? [];

  // Run the AI Intake Agent
  const agentResult = await runIntakeAgent({
    stage,
    department,
    conversationHistory,
    departmentQuestions,
    slotFillState,
  });

  const aiResponseText = agentResult.next_question?.trim() || 'Could you provide a bit more detail on that?';

  // Save AI turn
  await RequestConversation.create({
    requestId,
    stage,
    sender: 'ai',
    agentName: 'AI Intake Agent',
    message: aiResponseText,
    timestamp: new Date(),
  });

  // Update request's activity log
  await Request.findByIdAndUpdate(requestId, {
    $push: {
      activityLog: {
        userId: session.user.id,
        action: `INTAKE_STAGE_${stage}_PROGRESS`,
        timestamp: new Date(),
        metadata: { stage, stage_complete: agentResult.stage_complete },
      },
    },
  });

  return NextResponse.json({
    aiMessage: aiResponseText,
    stage_complete: agentResult.stage_complete,
    slot_fill_update: agentResult.slot_fill_update ?? {},
  });
}

// GET — load conversation history for a given requestId + optional stage filter
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const stageParam = searchParams.get('stage');

  if (!requestId) {
    return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  }

  await connectToDatabase();

  const request = await Request.findById(requestId).lean();
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  const role = (session.user as unknown as { role?: string })?.role;
  const isRequester = request.requesterId.toString() === session.user.id;
  const isAdmin = role === 'eng_admin' || role === 'sys_admin';

  if (!isRequester && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const filter: Record<string, unknown> = { requestId };
  if (stageParam) {
    filter.stage = parseInt(stageParam, 10);
  }

  const turns = await RequestConversation.find(filter).sort({ timestamp: 1 }).lean();

  return NextResponse.json({
    department: request.department,
    title: request.title,
    status: request.status,
    turns,
  });
}
