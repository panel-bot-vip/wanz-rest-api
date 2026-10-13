import { makeAnthropicHandler } from '@/lib/anthropic';

export const runtime = 'nodejs';

export const GET = makeAnthropicHandler('claude-haiku-5-5');
