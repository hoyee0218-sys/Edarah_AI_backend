import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const guestSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    idDocument: {
      type: String,
      default: null,
    },
    nationality: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

applyIdTransform(guestSchema);

export type GuestDocument = InferSchemaType<typeof guestSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
};

export const Guest =
  (mongoose.models.Guest as mongoose.Model<GuestDocument>) ||
  mongoose.model<GuestDocument>("Guest", guestSchema);
