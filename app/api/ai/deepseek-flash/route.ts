import { makeAIHandler } from '@/lib/deepai';

export const runtime = 'nodejs';

export const GET = makeAIHandler('deepseek-v4.1-flash');
