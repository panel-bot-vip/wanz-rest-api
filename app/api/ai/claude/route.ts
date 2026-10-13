import { makeAIHandler } from '@/lib/deepai';

export const runtime = 'nodejs';

export const GET = makeAIHandler('claude-haiku-5-5');
