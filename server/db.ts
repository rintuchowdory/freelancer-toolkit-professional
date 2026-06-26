import { eq, and, gte, lte, desc, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  invoices, 
  expenses, 
  contacts, 
  vatReminders, 
  elsterChatHistory,
  userSettings,
  type Invoice,
  type Expense,
  type Contact,
  type VatReminder,
  type ElsterChatHistory,
  type UserSettings
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= INVOICES =============

export async function createInvoice(userId: number, data: Omit<typeof invoices.$inferInsert, 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoices).values({
    ...data,
    userId,
  });
  
  return result;
}

export async function getUserInvoices(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(invoices).where(
    and(eq(invoices.id, id), eq(invoices.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateInvoice(id: number, userId: number, data: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(invoices).set(data).where(
    and(eq(invoices.id, id), eq(invoices.userId, userId))
  );
}

// ============= EXPENSES =============

export async function createExpense(userId: number, data: Omit<typeof expenses.$inferInsert, 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(expenses).values({
    ...data,
    userId,
  });
}

export async function getUserExpenses(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  if (startDate && endDate) {
    return db.select().from(expenses).where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      )
    ).orderBy(desc(expenses.date));
  }
  
  return db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date));
}

export async function getExpensesByCategory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(expenses.category);
}

// ============= CONTACTS =============

export async function createContact(userId: number, data: Omit<typeof contacts.$inferInsert, 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(contacts).values({
    ...data,
    userId,
  });
}

export async function getUserContacts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.updatedAt));
}

export async function getContactById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(contacts).where(
    and(eq(contacts.id, id), eq(contacts.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateContact(id: number, userId: number, data: Partial<typeof contacts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(contacts).set(data).where(
    and(eq(contacts.id, id), eq(contacts.userId, userId))
  );
}

// ============= VAT REMINDERS =============

export async function createVatReminder(userId: number, data: Omit<typeof vatReminders.$inferInsert, 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(vatReminders).values({
    ...data,
    userId,
  });
}

export async function getUserVatReminders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(vatReminders).where(eq(vatReminders.userId, userId)).orderBy(vatReminders.dueDate);
}

export async function getUpcomingVatReminders(userId: number, daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return db.select().from(vatReminders).where(
    and(
      eq(vatReminders.userId, userId),
      eq(vatReminders.completed, false),
      gte(vatReminders.dueDate, now),
      lte(vatReminders.dueDate, futureDate)
    )
  ).orderBy(vatReminders.dueDate);
}

// ============= ELSTER CHAT HISTORY =============

export async function createElsterChatEntry(userId: number, data: Omit<typeof elsterChatHistory.$inferInsert, 'userId' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(elsterChatHistory).values({
    ...data,
    userId,
  });
}

export async function getUserElsterHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(elsterChatHistory)
    .where(eq(elsterChatHistory.userId, userId))
    .orderBy(desc(elsterChatHistory.createdAt))
    .limit(limit);
}

// ============= USER SETTINGS =============

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserSettings(userId: number, data: Omit<typeof userSettings.$inferInsert, 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserSettings(userId);
  
  if (existing) {
    return db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
  } else {
    return db.insert(userSettings).values({
      ...data,
      userId,
    });
  }
}

// ============= DASHBOARD STATS =============

export async function getDashboardStats(userId: number, year: number = new Date().getFullYear()) {
  const db = await getDb();
  if (!db) return null;
  
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);
  
  // Total revenue from paid invoices
  const paidInvoices = await db.select().from(invoices).where(
    and(
      eq(invoices.userId, userId),
      eq(invoices.status, 'paid'),
      gte(invoices.issueDate, startOfYear),
      lte(invoices.issueDate, endOfYear)
    )
  );
  
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);
  
  // Total expenses
  const expensesList = await db.select().from(expenses).where(
    and(
      eq(expenses.userId, userId),
      gte(expenses.date, startOfYear),
      lte(expenses.date, endOfYear)
    )
  );
  
  const totalExpenses = expensesList.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
  const deductibleExpenses = expensesList.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) * exp.deductiblePercentage / 100), 0);
  
  // Open invoices
  const openInvoices = await db.select().from(invoices).where(
    and(
      eq(invoices.userId, userId),
      eq(invoices.status, 'sent')
    )
  );
  
  const openAmount = openInvoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);
  
  return {
    totalRevenue,
    totalExpenses,
    deductibleExpenses,
    profit: totalRevenue - deductibleExpenses,
    openInvoices: openInvoices.length,
    openAmount,
    invoiceCount: paidInvoices.length,
  };
}
