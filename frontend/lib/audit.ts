// /lib/audit.ts — Audit Log helper utility (Task 5.1)
// Append-only write helper for compliance and governance

import connectToDatabase from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

export interface AuditLogPayload {
  actorId?: string | mongoose.Types.ObjectId;
  actionType: string;
  entityType: string;
  entityId: string | mongoose.Types.ObjectId;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Inserts an append-only document into the AuditLog collection.
 * Catches errors internally so an audit log failure never breaks primary operations.
 */
export async function writeAuditLog(payload: AuditLogPayload): Promise<void> {
  try {
    await connectToDatabase();

    const actorObjectId = payload.actorId
      ? typeof payload.actorId === 'string'
        ? new mongoose.Types.ObjectId(payload.actorId)
        : payload.actorId
      : new mongoose.Types.ObjectId('000000000000000000000000'); // system fallback

    const entityObjectId =
      typeof payload.entityId === 'string'
        ? new mongoose.Types.ObjectId(payload.entityId)
        : payload.entityId;

    await AuditLog.create({
      actorId: actorObjectId,
      actionType: payload.actionType,
      entityType: payload.entityType,
      entityId: entityObjectId,
      beforeState: payload.beforeState ?? undefined,
      afterState: payload.afterState ?? undefined,
      ipAddress: payload.ipAddress ?? undefined,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('⚠️ Failed to write audit log entry:', err);
  }
}
