import { makeAnthropicHandler } from '@/lib/anthropic';

export const runtime = 'nodejs';

export const GET = makeAnthropicHandler('claude-opus-5-5');
