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

const timelineEntrySchema = z.object({
  slug: z.string(),
  date: z.string(),
  year: z.number().int(),
  era: z.string(),
  era_label: z.string(),
  era_glyph: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  location: z.string(),
  hero_image: z.string(),
  hero_caption: z.string().optional(),
  quote: z.string().optional(),
  quote_translation: z.string().optional(),
  characters: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    age: z.string().optional(),
    note: z.string().optional(),
  })),
  objects: z.array(z.object({
    name: z.string(),
    note: z.string().optional(),
  })),
  books: z.array(z.object({
    id: z.number().int(),
    title: z.string(),
    role: z.string(),
  })),
  related: z.array(z.object({
    slug: z.string(),
    title: z.string(),
  })).optional(),
});

const timeline = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/timeline' }),
  schema: timelineEntrySchema,
});

const iobTimeline = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/iob-timeline' }),
  schema: timelineEntrySchema,
});

export const collections = { books, iobBooks, timeline, iobTimeline };
