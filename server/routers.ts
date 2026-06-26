import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= DASHBOARD =============
  dashboard: router({
    getStats: protectedProcedure
      .input(z.object({ year: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const year = input?.year || new Date().getFullYear();
        return db.getDashboardStats(ctx.user.id, year);
      }),
  }),

  // ============= INVOICES =============
  invoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserInvoices(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.id, ctx.user.id);
        if (!invoice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        }
        return invoice;
      }),

    create: protectedProcedure
      .input(z.object({
        number: z.string(),
        clientName: z.string(),
        clientAddress: z.string().optional(),
        clientEmail: z.string().email().optional(),
        clientTaxId: z.string().optional(),
        senderName: z.string(),
        senderAddress: z.string().optional(),
        senderTaxId: z.string().optional(),
        issueDate: z.date(),
        dueDate: z.date(),
        subtotal: z.string(),
        taxAmount: z.string(),
        total: z.string(),
        isKleinunternehmer: z.boolean().default(false),
        notes: z.string().optional(),
        lineItems: z.array(z.object({
          id: z.string(),
          description: z.string(),
          quantity: z.number(),
          unit: z.string(),
          unitPrice: z.number(),
          taxRate: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createInvoice(ctx.user.id, {
          ...input,
          subtotal: input.subtotal as any,
          taxAmount: input.taxAmount as any,
          total: input.total as any,
          lineItems: JSON.stringify(input.lineItems),
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.id, ctx.user.id);
        if (!invoice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        }
        return db.updateInvoice(input.id, ctx.user.id, {
          status: input.status,
          notes: input.notes,
        });
      }),
  }),

  // ============= EXPENSES =============
  expenses: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserExpenses(ctx.user.id, input?.startDate, input?.endDate);
      }),

    byCategory: protectedProcedure.query(async ({ ctx }) => {
      return db.getExpensesByCategory(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        description: z.string(),
        amount: z.string(),
        category: z.string(),
        deductiblePercentage: z.number().min(0).max(100).default(100),
        receipt: z.boolean().default(false),
        receiptUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createExpense(ctx.user.id, {
          ...input,
          amount: input.amount as any,
        });
      }),
  }),

  // ============= CONTACTS =============
  contacts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserContacts(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const contact = await db.getContactById(input.id, ctx.user.id);
        if (!contact) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
        }
        return contact;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        address: z.string().optional(),
        taxId: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createContact(ctx.user.id, {
          ...input,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          totalRevenue: "0" as any,
          invoiceCount: 0,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contact = await db.getContactById(input.id, ctx.user.id);
        if (!contact) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
        }
        const { id, ...updateData } = input;
        return db.updateContact(id, ctx.user.id, updateData);
      }),
  }),

  // ============= VAT REMINDERS =============
  vatReminders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserVatReminders(ctx.user.id);
    }),

    upcoming: protectedProcedure
      .input(z.object({ daysAhead: z.number().default(30) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUpcomingVatReminders(ctx.user.id, input?.daysAhead || 30);
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["voranmeldung", "jahreserklarung", "einkommensteuererklarung", "custom"]),
        year: z.number(),
        month: z.number().min(1).max(12).optional(),
        dueDate: z.date(),
        notificationEnabled: z.boolean().default(true),
        notificationDaysBefore: z.number().default(7),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVatReminder(ctx.user.id, input);
      }),
  }),

  // ============= ELSTER CHAT =============
  elster: router({
    chat: protectedProcedure
      .input(z.object({ question: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // This will be implemented with real LLM integration
        // For now, return a placeholder
        const answer = "Diese Funktion wird in Kürze mit echtem LLM-Backend integriert.";
        
        await db.createElsterChatEntry(ctx.user.id, {
          question: input.question,
          answer,
          model: "gpt-4o",
          tokensUsed: 0,
        });

        return { question: input.question, answer };
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserElsterHistory(ctx.user.id, input?.limit || 50);
      }),
  }),

  // ============= USER SETTINGS =============
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        isKleinunternehmer: z.boolean().optional(),
        businessName: z.string().optional(),
        businessAddress: z.string().optional(),
        taxNumber: z.string().optional(),
        vatId: z.string().optional(),
        invoicePrefix: z.string().optional(),
        nextInvoiceNumber: z.number().optional(),
        currency: z.string().optional(),
        language: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertUserSettings(ctx.user.id, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
