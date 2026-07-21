import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const chargeSchema = new Schema(
  {
    stayId: {
      type: Schema.Types.ObjectId,
      ref: "Stay",
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["room", "minibar", "restaurant", "laundry", "other"],
      default: "other",
    },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

applyIdTransform(chargeSchema);

export type ChargeDocument = InferSchemaType<typeof chargeSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
};

export const Charge =
  (mongoose.models.Charge as mongoose.Model<ChargeDocument>) ||
  mongoose.model<ChargeDocument>("Charge", chargeSchema);
