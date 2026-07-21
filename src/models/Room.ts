import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const roomSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
      index: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: [
        "available",
        "occupied",
        "dirty",
        "cleaning",
        "maintenance",
        "out_of_order",
      ],
      default: "available",
      index: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

roomSchema.index({ hotelId: 1, number: 1 }, { unique: true });

roomSchema.virtual("roomType", {
  ref: "RoomType",
  localField: "roomTypeId",
  foreignField: "_id",
  justOne: true,
});

applyIdTransform(roomSchema);

export type RoomDocument = InferSchemaType<typeof roomSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
  roomType?: unknown;
};

export const Room =
  (mongoose.models.Room as mongoose.Model<RoomDocument>) ||
  mongoose.model<RoomDocument>("Room", roomSchema);
