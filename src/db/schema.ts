import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  provider: text("provider").default("google"),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const characters = pgTable("characters", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  age: text("age"),
  personality: text("personality"),
  backstory: text("backstory"),
  fears: text("fears"),
  motivations: text("motivations"),
  voice: text("voice"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const places = pgTable("places", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  atmosphere: text("atmosphere"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const worldRules = pgTable("world_rules", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const scenes = pgTable("scenes", {
  id: text("id").primaryKey(),
  chapterId: text("chapterId").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").default(""),
  synopsis: text("synopsis").default(""),
  status: text("status").default("borrador"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const sceneVersions = pgTable("scene_versions", {
  id: text("id").primaryKey(),
  sceneId: text("sceneId").notNull().references(() => scenes.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio").default(""),
  website: text("website").default(""),
  location: text("location").default(""),
  avatar: text("avatar").default(""),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const sceneComments = pgTable("scene_comments", {
  id: text("id").primaryKey(),
  sceneId: text("scene_id").notNull().references(() => scenes.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  anchor: text("anchor").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const publications = pgTable("publications", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre").notNull(),
  publishedAt: timestamp("published_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  coverImage: text("cover_image").default(""),
});

export const ratings = pgTable("ratings", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stars: integer("stars").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const publicationComments = pgTable("publication_comments", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});