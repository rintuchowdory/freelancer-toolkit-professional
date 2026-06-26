import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  json,
  datetime
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Invoices table — stores invoice metadata and line items
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  number: varchar("number", { length: 50 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientAddress: text("clientAddress"),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientTaxId: varchar("clientTaxId", { length: 50 }),
  
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderAddress: text("senderAddress"),
  senderTaxId: varchar("senderTaxId", { length: 50 }),
  
  issueDate: datetime("issueDate").notNull(),
  dueDate: datetime("dueDate").notNull(),
  
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue"]).default("draft").notNull(),
  isKleinunternehmer: boolean("isKleinunternehmer").default(false).notNull(),
  
  notes: text("notes"),
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  
  lineItems: json("lineItems").notNull(), // Array of {id, description, quantity, unit, unitPrice, taxRate}
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Expenses table — stores expense entries with categorization
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  date: datetime("date").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  category: varchar("category", { length: 50 }).notNull(), // buero, software, reise, weiterbildung, kommunikation, marketing, versicherung, steuerberatung, homeoffice, sonstiges
  deductiblePercentage: int("deductiblePercentage").default(100).notNull(), // 0-100
  
  receipt: boolean("receipt").default(false).notNull(),
  receiptUrl: varchar("receiptUrl", { length: 512 }),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Contacts table — CRM for client management
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  address: text("address"),
  taxId: varchar("taxId", { length: 50 }),
  
  totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default("0").notNull(),
  invoiceCount: int("invoiceCount").default(0).notNull(),
  
  notes: text("notes"),
  tags: json("tags"), // Array of strings
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * VAT Reminders table — tracks Voranmeldung and Jahreserklärung deadlines
 */
export const vatReminders = mysqlTable("vatReminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  type: mysqlEnum("type", ["voranmeldung", "jahreserklarung", "einkommensteuererklarung", "custom"]).notNull(),
  year: int("year").notNull(),
  month: int("month"), // 1-12, null for annual
  
  dueDate: datetime("dueDate").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedDate: datetime("completedDate"),
  
  notificationEnabled: boolean("notificationEnabled").default(true).notNull(),
  notificationDaysBefore: int("notificationDaysBefore").default(7).notNull(),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VatReminder = typeof vatReminders.$inferSelect;
export type InsertVatReminder = typeof vatReminders.$inferInsert;

/**
 * ELSTER Chat History — stores user questions and AI responses
 */
export const elsterChatHistory = mysqlTable("elsterChatHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  
  model: varchar("model", { length: 50 }).default("gpt-4o").notNull(),
  tokensUsed: int("tokensUsed"),
  
  helpful: boolean("helpful"), // User feedback
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ElsterChatHistory = typeof elsterChatHistory.$inferSelect;
export type InsertElsterChatHistory = typeof elsterChatHistory.$inferInsert;

/**
 * User Settings table — stores per-user configuration
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  isKleinunternehmer: boolean("isKleinunternehmer").default(false).notNull(),
  businessName: varchar("businessName", { length: 255 }),
  businessAddress: text("businessAddress"),
  taxNumber: varchar("taxNumber", { length: 50 }),
  vatId: varchar("vatId", { length: 50 }),
  
  invoicePrefix: varchar("invoicePrefix", { length: 20 }).default("RE").notNull(),
  nextInvoiceNumber: int("nextInvoiceNumber").default(1).notNull(),
  
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  language: varchar("language", { length: 5 }).default("de").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
