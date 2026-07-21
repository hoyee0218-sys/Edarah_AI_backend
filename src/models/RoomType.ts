import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const roomTypeSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      default: 2,
      min: 1,
    },
    amenities: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

applyIdTransform(roomTypeSchema);

export type RoomTypeDocument = InferSchemaType<typeof roomTypeSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
};

export const RoomType =
  (mongoose.models.RoomType as mongoose.Model<RoomTypeDocument>) ||
  mongoose.model<RoomTypeDocument>("RoomType", roomTypeSchema);
