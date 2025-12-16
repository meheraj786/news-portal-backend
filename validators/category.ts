import { z } from "zod";

export const categorySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;
