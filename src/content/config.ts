import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
});

const beforeReading = defineCollection({
  type: 'content',
  schema: baseSchema,
});

const chapters = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    order: z.number(),
  }),
});

const afterReading = defineCollection({
  type: 'content',
  schema: baseSchema,
});

const articles = defineCollection({
  type: 'content',
  schema: baseSchema,
});

export const collections = {
  'before-reading': beforeReading,
  'chapters': chapters,
  'after-reading': afterReading,
  'articles': articles,
};