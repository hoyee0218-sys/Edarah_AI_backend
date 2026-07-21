import { Schema } from 'mongoose';

function isObjectId(value: unknown): boolean {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { _bsontype?: string })._bsontype === 'ObjectId'
  );
}

/** Map `_id` → `id` and stringify bare ObjectId refs. */
export function applyIdTransform(schema: Schema) {
  const transform = (_doc: unknown, ret: Record<string, unknown>) => {
    if (ret._id != null) {
      ret.id = String(ret._id);
      delete ret._id;
    }

    for (const [key, value] of Object.entries(ret)) {
      if (isObjectId(value)) {
        ret[key] = String(value);
      }
    }

    return ret;
  };

  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { virtuals: true, versionKey: false, transform });
}

export function idOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: unknown }).id);
  }
  return String(value);
}
