import { z } from "zod";

export const ScriptItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("stack"),
    duration: z.number().optional().default(60),
  }),
  z.object({
    type: z.literal("focus"),
    page: z.number(),
    duration: z.number().optional().default(90),
    title: z.string().optional(),
  }),
  z.object({
    type: z.literal("switch"),
    page: z.number(),
    duration: z.number().optional().default(90),
    title: z.string().optional(),
  }),
  z.object({
    type: z.literal("fan"),
    page: z.number(),
    duration: z.number().optional().default(120),
    title: z.string().optional(),
  }),
]);

export type ScriptItem = z.infer<typeof ScriptItemSchema>;

export const PdfShowcaseSchema = z.object({
  src: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  pages: z.array(z.number()).optional(),
  highlights: z.array(z.number()).optional(),
  pageTitles: z.record(z.string(), z.string()).optional(),
  pageDescriptions: z.record(z.string(), z.string()).optional(),
  script: z.array(ScriptItemSchema).optional(),
});

export type PdfShowcaseProps = z.infer<typeof PdfShowcaseSchema>;

export interface PageInfo {
  pageNumber: number;
  totalPages: number;
}
