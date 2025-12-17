import { z } from "zod";

const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CNY"] as const;

const TRANSACTION_CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Education", "Other Income"],
  expense: ["Groceries", "Dining Out", "Transportation", "Utilities", "Entertainment", "Healthcare", "Shopping", "Education", "Other"],
} as const;

const BUDGET_CATEGORIES = ["Groceries", "Entertainment", "Transportation", "Dining Out", "Shopping", "Utilities", "Healthcare", "Education", "Bills", "Loans", "Other"] as const;

const BILL_CATEGORIES = ["Rent", "Utilities", "Internet", "Phone", "Subscriptions", "Insurance", "Loan", "Other"] as const;

const BILL_FREQUENCIES = ["weekly", "monthly", "quarterly", "yearly"] as const;

const ACCOUNT_TYPES = ["checking", "savings", "credit", "investment"] as const;

const LOAN_TYPES = ["personal_loan", "home_loan", "auto_loan", "education_loan", "credit_card", "other"] as const;

const BUDGET_PERIODS = ["weekly", "monthly", "yearly"] as const;

// Transaction validation schema
export const transactionSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(200, "Description must be less than 200 characters"),
  amount: z.number().positive("Amount must be greater than 0").max(999999999, "Amount is too large"),
  type: z.enum(["income", "expense"]),
  date: z.string().refine((date) => {
    const d = new Date(date);
    const now = new Date();
    const minDate = new Date("1900-01-01");
    return d >= minDate && d <= now;
  }, "Date must be between 1900 and today"),
  category: z.string().min(1, "Category is required"),
  account_id: z.string().uuid().optional().or(z.literal("")),
  currency: z.enum(ALLOWED_CURRENCIES),
});

// Account validation schema
export const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required").max(100, "Account name must be less than 100 characters"),
  type: z.enum(ACCOUNT_TYPES, { errorMap: () => ({ message: "Please select an account type" }) }),
  balance: z.number().min(-999999999, "Balance is too low").max(999999999, "Balance is too high"),
  currency: z.enum(ALLOWED_CURRENCIES),
});

// Budget validation schema
export const budgetSchema = z.object({
  category: z.enum(BUDGET_CATEGORIES as unknown as [string, ...string[]], { errorMap: () => ({ message: "Please select a category" }) }),
  limit_amount: z.number().positive("Budget limit must be greater than 0").max(999999999, "Budget limit is too large"),
  period: z.enum(BUDGET_PERIODS),
});

// Bill validation schema
export const billSchema = z.object({
  name: z.string().trim().min(1, "Bill name is required").max(100, "Bill name must be less than 100 characters"),
  amount: z.number().positive("Amount must be greater than 0").max(999999999, "Amount is too large"),
  currency: z.enum(ALLOWED_CURRENCIES),
  category: z.enum(BILL_CATEGORIES as unknown as [string, ...string[]], { errorMap: () => ({ message: "Please select a category" }) }),
  due_date: z.string().min(1, "Due date is required"),
  frequency: z.enum(BILL_FREQUENCIES),
  reminder_days: z.number().int().min(0, "Reminder days must be 0 or more").max(30, "Reminder days must be 30 or less"),
});

// Loan validation schema
export const loanSchema = z.object({
  name: z.string().trim().min(1, "Loan name is required").max(100, "Loan name must be less than 100 characters"),
  type: z.enum(LOAN_TYPES),
  principal_amount: z.number().positive("Principal amount must be greater than 0").max(999999999999, "Principal amount is too large"),
  interest_rate: z.number().min(0, "Interest rate cannot be negative").max(100, "Interest rate cannot exceed 100%"),
  tenure_months: z.number().int().positive("Tenure must be at least 1 month").max(600, "Tenure cannot exceed 600 months"),
  start_date: z.string().min(1, "Start date is required"),
  due_day: z.number().int().min(1, "Due day must be between 1 and 31").max(31, "Due day must be between 1 and 31"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type BillInput = z.infer<typeof billSchema>;
export type LoanInput = z.infer<typeof loanSchema>;

export {
  ALLOWED_CURRENCIES,
  TRANSACTION_CATEGORIES,
  BUDGET_CATEGORIES,
  BILL_CATEGORIES,
  BILL_FREQUENCIES,
  ACCOUNT_TYPES,
  LOAN_TYPES,
  BUDGET_PERIODS,
};
