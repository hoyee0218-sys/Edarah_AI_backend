import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const invoiceSchema = new Schema(
  {
    stayId: {
      type: Schema.Types.ObjectId,
      ref: "Stay",
      required: true,
      unique: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    roomTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    chargesTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["issued", "paid", "void"],
      default: "issued",
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

invoiceSchema.virtual("stay", {
  ref: "Stay",
  localField: "stayId",
  foreignField: "_id",
  justOne: true,
});

applyIdTransform(invoiceSchema);

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
  stay?: unknown;
};

export const Invoice =
  (mongoose.models.Invoice as mongoose.Model<InvoiceDocument>) ||
  mongoose.model<InvoiceDocument>("Invoice", invoiceSchema);
