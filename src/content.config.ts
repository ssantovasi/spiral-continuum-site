import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const books = defineCollection({
  loader: glob({ pattern: 'book*.md', base: './src/content/books' }),
  schema: z.object({
    id: z.number().int(),
    reading_order: z.number().int(),
    volume_roman: z.string(),
    title: z.string(),
    subtitle: z.string().nullable(),
    tagline: z.string(),
    pages: z.number().int(),
    words: z.number().int(),
    voice_register: z.string(),
    isbn_paperback: z.string().nullable(),
    isbn_hardcover: z.string().nullable(),
    asin: z.string().nullable(),
    art: z.object({
      front: z.string(),
      back: z.string(),
      spine: z.string(),
      flap: z.string(),
      scene: z.string(),
      map: z.string(),
    }),
  }),
});

const iobBooks = defineCollection({
  loader: glob({ pattern: 'book*.md', base: './src/content/iob-books' }),
  schema: z.object({
    id: z.number().int(),
    reading_order: z.number().int(),
    volume_label: z.string(),
    title: z.string(),
    title_status: z.enum(['locked', 'working']).optional(),
    subtitle: z.string().nullable().optional(),
    tagline: z.string(),
    status: z.enum(['drafted', 'in progress', 'beat sheet']),
    voice_register: z.string().optional(),
    setting: z.string().optional(),
    art: z.object({
      front: z.string().nullable(),
      back: z.string().nullable(),
      spine: z.string().nullable(),
      flap: z.string().nullable(),
    }),
  }),
});

export const collections = { books, iobBooks };
