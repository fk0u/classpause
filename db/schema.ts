import {
  pgTable, pgEnum, text, integer, timestamp, jsonb, primaryKey, index, uniqueIndex, uuid, smallint,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "komti", "lecturer"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled", "pending", "confirmed", "delayed", "reschedule", "rescheduled", "micropause",
]);
export const permissionTypeEnum = pgEnum("permission_type", ["sick", "dispensation"]);
export const permissionStatusEnum = pgEnum("permission_status", ["pending", "approved", "rejected", "expired"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "permit", "sick", "absent", "micropause"]);
export const changeStatusEnum = pgEnum("change_status", ["pending", "confirmed", "rejected", "cancelled"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull(),
  studentNo: text("student_no"),
  telegramChatId: text("telegram_chat_id"),
  locale: text("locale").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  building: text("building").notNull(),
  capacity: integer("capacity").notNull(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  section: text("section").notNull(),
  lecturerId: uuid("lecturer_id").notNull().references(() => users.id),
  komtiId: uuid("komti_id").references(() => users.id),
  credits: smallint("credits").notNull().default(3),
});

export const enrollments = pgTable("enrollments", {
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.classId, t.userId] }), index("enrollments_user_idx").on(t.userId)]);

/** Weekly timetable. day: 1 = Monday … 7 = Sunday. Minutes are local campus time (WITA). */
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").notNull().references(() => rooms.id),
  day: smallint("day").notNull(),
  startMin: smallint("start_min").notNull(),
  endMin: smallint("end_min").notNull(),
}, (t) => [index("meetings_day_idx").on(t.day), index("meetings_class_idx").on(t.classId)]);

export type SlotProposal = {
  id: string;
  kind: "optimal" | "alt" | "async";
  startsAt?: string;
  endsAt?: string;
  roomId?: string;
  roomCode?: string;
  conflicts: number;
  enrolled: number;
};

/** One concrete lecture occurrence: the unit the SLA protocol runs on. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").notNull().references(() => rooms.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  promptedAt: timestamp("prompted_at", { withTimezone: true }),
  slaDeadline: timestamp("sla_deadline", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  delayMinutes: smallint("delay_minutes"),
  tokenHash: text("token_hash"),
  proposals: jsonb("proposals").$type<SlotProposal[]>(),
  lockedSlot: jsonb("locked_slot").$type<SlotProposal>(),
  /** Class activity photo the komti must upload while the class runs. */
  photoPath: text("photo_path"),
  photoAt: timestamp("photo_at", { withTimezone: true }),
  photoRemindedAt: timestamp("photo_reminded_at", { withTimezone: true }),
  /** SiPenDosa reminders already sent to the lecturer (H-1 evening, H-0 morning). */
  remindedH1At: timestamp("reminded_h1_at", { withTimezone: true }),
  remindedH0At: timestamp("reminded_h0_at", { withTimezone: true }),
  version: integer("version").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("sessions_class_start_uq").on(t.classId, t.startsAt),
  index("sessions_status_deadline_idx").on(t.status, t.slaDeadline),
  index("sessions_starts_idx").on(t.startsAt),
  uniqueIndex("sessions_token_uq").on(t.tokenHash),
]);

export type QuizItem = { q: string; options: string[]; answer: number };
export type ModuleStep = { title: string; body: string };

export const microModules = pgTable("micro_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  minutes: smallint("minutes").notNull().default(15),
  steps: jsonb("steps").$type<ModuleStep[]>().notNull(),
  quiz: jsonb("quiz").$type<QuizItem[]>().notNull(),
}, (t) => [index("modules_class_idx").on(t.classId)]);

export const attendanceReceipts = pgTable("attendance_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  correct: smallint("correct").notNull(),
  total: smallint("total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("receipts_session_user_uq").on(t.sessionId, t.userId)]);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: permissionTypeEnum("type").notNull(),
  note: text("note").notNull(),
  status: permissionStatusEnum("status").notNull().default("pending"),
  decidedBy: uuid("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  /** Permitly: the supporting letter (doctor's note, dispensation letter). It may come later, but not after proofDueAt. */
  proofPath: text("proof_path"),
  proofName: text("proof_name"),
  proofAt: timestamp("proof_at", { withTimezone: true }),
  proofDueAt: timestamp("proof_due_at", { withTimezone: true }),
  proofRemindedAt: timestamp("proof_reminded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("permissions_session_user_uq").on(t.sessionId, t.userId),
  index("permissions_status_idx").on(t.status),
]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("events_created_idx").on(t.createdAt)]);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("push_user_idx").on(t.userId)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull().default("/"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("notifications_user_created_idx").on(t.userId, t.createdAt)]);

/** A study group's hold on a free room slot (rooms freed by cancelled classes show up here too). */
export const roomClaims = pgTable("room_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("room_claims_slot_uq").on(t.roomId, t.startsAt)]);

export const facilityKindEnum = pgEnum("facility_kind", ["marker", "projector", "ac", "cleanliness", "parking_full", "other"]);

/** One-tap crowd reports about rooms and parking. "Me too" bumps confirms instead of duplicating. */
export const facilityReports = pgTable("facility_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  place: text("place").notNull(),
  kind: facilityKindEnum("kind").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  confirms: integer("confirms").notNull().default(1),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("facility_created_idx").on(t.createdAt)]);

/** One row per student per session: the official attendance record. */
export const attendance = pgTable("attendance", {
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: attendanceStatusEnum("status").notNull(),
  source: text("source").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.sessionId, t.userId] }), index("attendance_user_idx").on(t.userId)]);

/** A lecturer asks to move a class; the komti confirms one of the conflict-free slots. */
export const changeRequests = pgTable("change_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  proposals: jsonb("proposals").$type<SlotProposal[]>().notNull(),
  chosen: jsonb("chosen").$type<SlotProposal>(),
  status: changeStatusEnum("status").notNull().default("pending"),
  decidedBy: uuid("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("change_requests_status_idx").on(t.status)]);

/** Campus holidays: SiPenDosa skips reminders and the clock skips sessions on these dates (YYYY-MM-DD, WITA). */
export const holidays = pgTable("holidays", {
  date: text("date").primaryKey(),
  name: text("name").notNull(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionStatus = (typeof sessionStatusEnum.enumValues)[number];
