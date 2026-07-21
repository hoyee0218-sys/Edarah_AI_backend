import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { applyIdTransform } from './plugins.js';

const auditLogSchema = new Schema(
  {
    hotelId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Hotel', 
      required: true, 
      index: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    },
    action: { 
      type: String, 
      required: true 
    },
    entityType: { 
      type: String, 
      required: true 
    },
    entityId: { 
      type: String, 
      default: null
    },
    details: { 
      type: String, 
      default: null
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

applyIdTransform(auditLogSchema);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
};

export const AuditLog =
  (mongoose.models.AuditLog as mongoose.Model<AuditLogDocument>) ||
  mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);
