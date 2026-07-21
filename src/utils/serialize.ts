type JsonDoc = { toJSON: () => unknown };

/** Convert a Mongoose document (with virtuals) into a plain API object. */
export function toApi<T extends object = Record<string, unknown>>(
  doc: JsonDoc,
): T;
export function toApi<T extends object = Record<string, unknown>>(
  doc: JsonDoc | null | undefined,
): T | null;
export function toApi<T extends object = Record<string, unknown>>(
  doc: JsonDoc | null | undefined,
): T | null {
  if (!doc) return null;
  return doc.toJSON() as T;
}

export function toApiList<T extends object = Record<string, unknown>>(
  docs: JsonDoc[],
): T[] {
  return docs.map((d) => d.toJSON() as T);
}
