import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function writeAuditLog(params: {
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  meta?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
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
