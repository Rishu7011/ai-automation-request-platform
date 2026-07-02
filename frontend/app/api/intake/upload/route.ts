// Task 7.2 — File Upload API
// Handles file upload, stores file locally under public/uploads/, creates RequestAttachment record,
// and invokes DocumentAnalysisAgent.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestAttachment } from '@/models/RequestAttachment';
import { runDocumentAnalysisAgent } from '@/lib/agents/document-analysis-agent';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/csv',
  'text/plain',
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestId = formData.get('requestId') as string | null;
    const stageStr = formData.get('stage') as string | null;

    if (!file || !requestId) {
      return NextResponse.json({ error: 'file and requestId are required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 15MB limit' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('text/')) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported` },
        { status: 400 }
      );
    }

    await connectToDatabase();

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

    const stage = stageStr ? parseInt(stageStr, 10) : 1;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', requestId);
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);
    const publicUrl = `/uploads/${requestId}/${safeFileName}`;

    await fs.writeFile(filePath, buffer);

    // Create RequestAttachment record
    const attachment = await RequestAttachment.create({
      requestId: new mongoose.Types.ObjectId(requestId),
      uploadedBy: new mongoose.Types.ObjectId(session.user.id),
      fileName: safeFileName,
      fileType: file.type,
      originalName: file.name,
      fileSize: file.size,
      filePath: publicUrl,
      storageUrl: publicUrl,
      stage,
      scanStatus: 'clean',
    });

    // Extract raw text for plain text or csv files
    let extractedText = '';
    if (file.type.startsWith('text/') || file.type === 'text/csv') {
      extractedText = buffer.toString('utf-8');
    }

    // Run document analysis agent
    const analysis = await runDocumentAnalysisAgent({
      filename: file.name,
      mimeType: file.type,
      stage,
      department: request.department,
      fileTextContent: extractedText,
    });

    return NextResponse.json({
      success: true,
      attachment,
      analysis,
    });
  } catch (err) {
    console.error('[File Upload] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
