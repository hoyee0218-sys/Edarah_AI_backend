import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const staySchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
    },
    checkedOutAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

staySchema.virtual("guest", {
  ref: "Guest",
  localField: "guestId",
  foreignField: "_id",
  justOne: true,
});

staySchema.virtual("room", {
  ref: "Room",
  localField: "roomId",
  foreignField: "_id",
  justOne: true,
});

staySchema.virtual("reservation", {
  ref: "Reservation",
  localField: "reservationId",
  foreignField: "_id",
  justOne: true,
});

staySchema.virtual("charges", {
  ref: "Charge",
  localField: "_id",
  foreignField: "stayId",
});

staySchema.virtual("invoice", {
  ref: "Invoice",
  localField: "_id",
  foreignField: "stayId",
  justOne: true,
});

applyIdTransform(staySchema);

export type StayDocument = InferSchemaType<typeof staySchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
};

export const Stay =
  (mongoose.models.Stay as mongoose.Model<StayDocument>) ||
  mongoose.model<StayDocument>("Stay", staySchema);
