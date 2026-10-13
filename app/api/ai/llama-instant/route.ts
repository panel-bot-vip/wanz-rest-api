import { makeAIHandler } from '@/lib/deepai';

export const runtime = 'nodejs';

export const GET = makeAIHandler('llama-3.1-8b-instant');
