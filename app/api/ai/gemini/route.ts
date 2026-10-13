import { makeAIHandler } from '@/lib/deepai';

export const runtime = 'nodejs';

export const GET = makeAIHandler('gemini-2.5-flash');
