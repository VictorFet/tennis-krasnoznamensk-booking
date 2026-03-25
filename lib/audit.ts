import { AuditAction } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function writeAuditLog(params: {
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      meta: params.meta
    }
  });
}
