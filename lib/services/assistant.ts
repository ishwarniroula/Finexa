import { getCategoryConfig } from "@/constants/categories";
import type { Budget } from "@/lib/services/budgets";
import type { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "@/lib/utils";
import { format, isSameMonth, subDays } from "date-fns";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
  finishReason?: string;
};

async function generateAnswer(prompt: string, apiKey: string) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed: ${errText}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0] as GeminiCandidate | undefined;
  const text = candidate?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("No response from Gemini");
  return { text, finishReason: candidate?.finishReason };
}

function buildContext(
  transactions: Transaction[],
  budget: Budget | null,
  currency: string
) {
  const now = new Date();
  const cutoff = subDays(now, 30);
  const recent = transactions.filter((tx) => new Date(tx.date) >= cutoff);
  const thisMonthExpense = transactions
    .filter((tx) => tx.type === "EXPENSE" && isSameMonth(new Date(tx.date), now))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const spentByCategory: Record<string, number> = {};
  let income = 0;
  let expense = 0;

  recent.forEach((tx) => {
    if (tx.type === "EXPENSE") {
      expense += tx.amount;
      spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount;
    } else {
      income += tx.amount;
    }
  });

  const categoryLines = Object.entries(spentByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) =>
        `- ${getCategoryConfig(category as any).label}: ${formatPrice(amount, currency)}`
    )
    .join("\n");

  const budgetLine = budget
    ? `${formatPrice(thisMonthExpense, currency)} spent of ${formatPrice(
        budget.amount,
        currency
      )} monthly budget`
    : "No monthly budget set.";

  const txLines = recent
    .slice(0, 40)
    .map(
      (tx) =>
        `- ${format(new Date(tx.date), "d MMM yyyy")} | ${tx.type} | ${
          getCategoryConfig(tx.category).label
        } | ${formatPrice(tx.amount, currency)}${
          tx.description ? ` | ${tx.description}` : ""
        }`
    )
    .join("\n");

  return `Last 30 days summary:
Total income: ${formatPrice(income, currency)}
Total expense: ${formatPrice(expense, currency)}

Spending by category:
${categoryLines || "No expenses recorded."}

Monthly budget:
${budgetLine}

Recent transactions:
${txLines || "No transactions recorded."}`;
}

function answerTotalSpendingQuestion(
  question: string,
  transactions: Transaction[],
  currency: string
) {
  const asksForTotal =
    /\bhow much\b/i.test(question) && /\b(?:spend|spent|spending)\b/i.test(question);
  if (!asksForTotal) return null;

  const normalizedQuestion = question.toLowerCase();
  let expenses = transactions.filter((tx) => tx.type === "EXPENSE");
  let period = "across all recorded transactions";

  if (/\b(this|current) month\b/.test(normalizedQuestion)) {
    const now = new Date();
    expenses = expenses.filter((tx) => isSameMonth(new Date(tx.date), now));
    period = "this month";
  } else if (/\b(last|past) 30 days\b/.test(normalizedQuestion)) {
    const cutoff = subDays(new Date(), 30);
    cutoff.setHours(0, 0, 0, 0);
    expenses = expenses.filter((tx) => new Date(tx.date) >= cutoff);
    period = "in the last 30 days";
  }

  const total = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  if (total === 0) {
    return `There are no expense transactions recorded ${period}.`;
  }
  return `You have spent ${formatPrice(total, currency)} ${period}.`;
}

function answerTopSpendingQuestion(
  question: string,
  transactions: Transaction[],
  currency: string
) {
  const normalizedQuestion = question.toLowerCase();
  const asksForTopCategory =
    /\b(most|biggest|largest|highest)\b/.test(normalizedQuestion) &&
    /\b(spend|spent|spending|expense|expenses)\b/.test(normalizedQuestion);
  if (!asksForTopCategory) return null;

  const totals = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (transaction.type !== "EXPENSE") return;
    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) + transaction.amount
    );
  });

  const topCategory = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!topCategory) return "There are no expense transactions recorded yet.";

  return `Your highest spending category is ${getCategoryConfig(topCategory[0] as any).label}, at ${formatPrice(topCategory[1], currency)} across all recorded transactions.`;
}

export async function askAssistant(
  question: string,
  transactions: Transaction[],
  budget: Budget | null,
  currency: string
) {
  const topSpendingAnswer = answerTopSpendingQuestion(
    question,
    transactions,
    currency
  );
  if (topSpendingAnswer) return topSpendingAnswer;

  const directAnswer = answerTotalSpendingQuestion(
    question,
    transactions,
    currency
  );
  if (directAnswer) return directAnswer;

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY");

  const context = buildContext(transactions, budget, currency);

  const prompt = `You are a helpful personal finance assistant inside the Welth app. Answer the user's question using only the financial data below. Answer in one or two complete sentences, be concise and specific with numbers, and end with proper punctuation. Never leave a word or sentence unfinished. If the data doesn't answer the question, say so.

${context}

User question: ${question}`;

  let answer = await generateAnswer(prompt, apiKey);
  if (
    answer.finishReason !== "STOP" ||
    !/[.!?]["')\]]?$/.test(answer.text)
  ) {
    answer = await generateAnswer(
      `${prompt}\n\nYour previous draft ended incompletely. Rewrite the entire answer as a complete, concise response. Do not continue the fragment.`,
      apiKey
    );
  }

  if (
    answer.finishReason !== "STOP" ||
    !/[.!?]["')\]]?$/.test(answer.text)
  ) {
    throw new Error("Gemini returned an incomplete answer after retrying");
  }

  return answer.text;
}
