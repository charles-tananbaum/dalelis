import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['plumbing', 'hvac', 'heating', 'cooling', 'water-heaters']),
    shortDescription: z.string(),
    heroTagline: z.string(),
    order: z.number().default(100),
    emergency: z.boolean().default(false),
    icon: z.string().default('wrench'),
    signsYouNeed: z.array(z.string()).optional(),
    whatWeDo: z.array(z.string()).optional(),
    image: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const serviceAreas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/service-areas' }),
  schema: z.object({
    name: z.string(),
    featured: z.boolean().default(false),
    intro: z.string(),
    population: z.string().optional(),
    neighborhoods: z.array(z.string()).optional(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    name: z.string(),
    rating: z.number().default(5),
    source: z.string().default('Google'),
    service: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { services, serviceAreas, testimonials };
