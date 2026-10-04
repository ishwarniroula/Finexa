export const CATEGORIES = {
  // ── EXPENSE (15) ──────────────────────────────────────────
  food: {
    label: "Food & Dining",
    icon: "🍔",
    color: "#FF6B6B",
    type: "EXPENSE",
  },
  groceries: {
    label: "Groceries",
    icon: "🛒",
    color: "#FF9F43",
    type: "EXPENSE",
  },
  transport: {
    label: "Transport",
    icon: "🚗",
    color: "#4ECDC4",
    type: "EXPENSE",
  },
  shopping: {
    label: "Shopping",
    icon: "🛍️",
    color: "#45B7D1",
    type: "EXPENSE",
  },
  entertainment: {
    label: "Entertainment",
    icon: "🎬",
    color: "#96CEB4",
    type: "EXPENSE",
  },
  health: {
    label: "Health",
    icon: "💊",
    color: "#FF8B94",
    type: "EXPENSE",
  },
  utilities: {
    label: "Utilities",
    icon: "💡",
    color: "#FFEAA7",
    type: "EXPENSE",
  },
  rent: {
    label: "Rent",
    icon: "🏠",
    color: "#DDA0DD",
    type: "EXPENSE",
  },
  education: {
    label: "Education",
    icon: "📚",
    color: "#98D8C8",
    type: "EXPENSE",
  },
  travel: {
    label: "Travel",
    icon: "✈️",
    color: "#F7DC6F",
    type: "EXPENSE",
  },
  insurance: {
    label: "Insurance",
    icon: "🛡️",
    color: "#A29BFE",
    type: "EXPENSE",
  },
  subscriptions: {
    label: "Subscriptions",
    icon: "📱",
    color: "#FD79A8",
    type: "EXPENSE",
  },
  emi: {
    label: "EMI / Loan",
    icon: "🏦",
    color: "#E17055",
    type: "EXPENSE",
  },
  personal_care: {
    label: "Personal Care",
    icon: "💇",
    color: "#FD9644",
    type: "EXPENSE",
  },
  other: {
    label: "Other",
    icon: "📦",
    color: "#BDC3C7",
    type: "EXPENSE",
  },

  // ── INCOME (6) ────────────────────────────────────────────
  salary: {
    label: "Salary",
    icon: "💼",
    color: "#2ECC71",
    type: "INCOME",
  },
  freelance: {
    label: "Freelance",
    icon: "💻",
    color: "#27AE60",
    type: "INCOME",
  },
  business: {
    label: "Business",
    icon: "🏢",
    color: "#00B894",
    type: "INCOME",
  },
  investment: {
    label: "Investment",
    icon: "📈",
    color: "#1ABC9C",
    type: "INCOME",
  },
  gift: {
    label: "Gift",
    icon: "🎁",
    color: "#3498DB",
    type: "INCOME",
  },
  other_income: {
    label: "Other Income",
    icon: "💰",
    color: "#8E44AD",
    type: "INCOME",
  },
} as const;

// ── DERIVED HELPERS ───────────────────────────────────────────

export type CategoryKey = keyof typeof CATEGORIES;

export const EXPENSE_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([, v]) => v.type === "EXPENSE")
  .map(([k, v]) => ({ key: k as CategoryKey, ...v }));

export const INCOME_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([, v]) => v.type === "INCOME")
  .map(([k, v]) => ({ key: k as CategoryKey, ...v }));

// single lookup by key - use this everywhere instead of CATEGORIES[key]
export const getCategoryConfig = (key: CategoryKey) => CATEGORIES[key];

// used in Gemini prompts - gives the model the full list of valid keys
export const CATEGORY_KEYS_EXPENSE = EXPENSE_CATEGORIES.map((c) => c.key);
export const CATEGORY_KEYS_INCOME = INCOME_CATEGORIES.map((c) => c.key);
