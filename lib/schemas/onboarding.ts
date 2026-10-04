import { z } from "zod";

export const onboardingSchema = z.object({
  startingBalance: z
    .string()
    .min(1, "Please enter a starting balance.")
    .refine((v) => {
      const parsed = parseFloat(v.replace(/,/g, ""));
      return !Number.isNaN(parsed) && parsed > 0;
    }, "Please enter a valid starting balance."),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
