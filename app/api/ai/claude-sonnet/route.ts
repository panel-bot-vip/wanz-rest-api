import { makeAnthropicHandler } from '@/lib/anthropic';

export const runtime = 'nodejs';

export const GET = makeAnthropicHandler('claude-sonnet-5-5');
