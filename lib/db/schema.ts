// lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  integer,
  json,
  uuid,
  real,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============ AUTH TABLES ============

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // For credentials login
  role: text("role").default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ============ EXAM TABLES ============

export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  jenjang: text("jenjang").notNull(), // SD, SMP, SMA
  kelas: integer("kelas").notNull(),
  semester: integer("semester").notNull(),
  mataPelajaran: text("mata_pelajaran").notNull(),

  // Soal (stored as JSON)
  soalPG: json("soal_pg").notNull(),
  soalEssay: json("soal_essay").notNull(),

  uploadedFileUrl: text("uploaded_file_url"),

  // The server's deadline is authoritative; the client timer only displays it.
  durasiMenit: integer("durasi_menit"),
  expiresAt: timestamp("expires_at"),
  // Set atomically on the first submit so an exam is graded at most once.
  submittedAt: timestamp("submitted_at"),
  retakeOfExamId: uuid("retake_of_exam_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examResults = pgTable("exam_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Jawaban user
  jawabanPG: json("jawaban_pg").notNull(),
  jawabanEssay: json("jawaban_essay").notNull(),

  // Hasil penilaian
  nilaiPG: real("nilai_pg").notNull(),
  nilaiEssay: real("nilai_essay").notNull(),
  nilaiTotal: real("nilai_total").notNull(),
  benarPG: integer("benar_pg").notNull(),
  salahPG: integer("salah_pg").notNull(),
  status: text("status").notNull(), // LULUS, TIDAK_LULUS

  // Pembahasan (stored as JSON)
  penilaianDetail: json("penilaian_detail"),
  pembahasan: json("pembahasan"),

  // Waktu
  waktuMulai: timestamp("waktu_mulai"),
  waktuSelesai: timestamp("waktu_selesai"),
  durasiMenit: integer("durasi_menit"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  exams: many(exams),
  examResults: many(examResults),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  user: one(users, {
    fields: [exams.userId],
    references: [users.id],
  }),
  results: many(examResults),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  exam: one(exams, {
    fields: [examResults.examId],
    references: [exams.id],
  }),
  user: one(users, {
    fields: [examResults.userId],
    references: [users.id],
  }),
}));

// ============ TYPES ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type ExamResult = typeof examResults.$inferSelect;
export type NewExamResult = typeof examResults.$inferInsert;

// Fixed-window request counters, keyed by action and caller (user id or IP).
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { mode: "date" }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.key, t.windowStart] }),
  })
);

// Text extracted from a student's uploaded study material; the original file is not kept.
export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  textContent: text("text_content").notNull(),
  charCount: integer("char_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
