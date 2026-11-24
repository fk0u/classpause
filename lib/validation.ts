import { z } from "zod";

export const uuid = z.string().uuid();

export const lecturerActionSchema = z.object({
  sessionId: uuid,
  action: z.enum(["confirm", "delay", "reschedule", "micropause"]),
});

export const magicActionSchema = z.object({
  token: z.string().min(20).max(100).regex(/^[A-Za-z0-9_-]+$/),
  action: lecturerActionSchema.shape.action,
});

export const lockSlotSchema = z.object({ sessionId: uuid, slotId: z.string().min(1).max(40) });

export const permissionSchema = z.object({
  sessionId: uuid,
  type: z.enum(["sick", "dispensation"]),
  note: z.string().trim().min(5, "Add a short reason (5+ characters)").max(280),
});

export const decidePermissionSchema = z.object({ permissionId: uuid, decision: z.enum(["approved", "rejected"]) });

export const quizSubmitSchema = z.object({
  sessionId: uuid,
  answers: z.array(z.number().int().min(0).max(9)).min(1).max(20),
});

export const signInSchema = z.object({ userId: uuid });

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
