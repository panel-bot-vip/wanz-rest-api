import { makePollinationsHandler } from '@/lib/pollinations';

export const runtime = 'nodejs';

export const GET = makePollinationsHandler('openai');
