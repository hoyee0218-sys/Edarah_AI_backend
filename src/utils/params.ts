import type { AuthRequest } from '../middleware/auth.js';

/** Express 5 types `params.id` as `string | string[]` — normalize to a single string. */
export function paramId(req: AuthRequest, name = 'id'): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}
