import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const hotelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

applyIdTransform(hotelSchema);

export type HotelDocument = InferSchemaType<typeof hotelSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
};

export const Hotel =
  (mongoose.models.Hotel as mongoose.Model<HotelDocument>) ||
  mongoose.model<HotelDocument>("Hotel", hotelSchema);
