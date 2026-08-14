import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const audioFile = pgTable(
  "audio_file",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userEmail: text("user_email").notNull(),
    userName: text("user_name").notNull(),
    originalFilename: text("original_filename").notNull(),
    originalMimeType: text("original_mime_type").notNull(),
    originalSizeBytes: integer("original_size_bytes").notNull(),
    originalBlobId: text("original_blob_id").notNull(),
    convertedFilename: text("converted_filename").notNull(),
    convertedMimeType: text("converted_mime_type").notNull().default("audio/mpeg"),
    convertedSizeBytes: integer("converted_size_bytes").notNull(),
    convertedBlobId: text("converted_blob_id").notNull(),
    cleanedFilename: text("cleaned_filename"),
    cleanedMimeType: text("cleaned_mime_type"),
    cleanedSizeBytes: integer("cleaned_size_bytes"),
    cleanedBlobId: text("cleaned_blob_id"),
    status: text("status").notNull().default("processing"),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
    finishedAt: timestamp("finished_at"),
    emailSentAt: timestamp("email_sent_at"),
  },
  (t) => ({
    userUploadedIdx: index("audio_file_user_uploaded_idx").on(
      t.userId,
      t.uploadedAt,
    ),
    uploadedIdx: index("audio_file_uploaded_idx").on(t.uploadedAt),
    statusIdx: index("audio_file_status_idx").on(t.status),
  }),
);