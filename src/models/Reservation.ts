import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./plugins.js";

const reservationSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
      index: true,
    },
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    checkInDate: {
      type: Date,
      required: true,
      index: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    adults: {
      type: Number,
      default: 1,
      min: 1,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "confirmed",
      index: true,
    },
    notes: { type: String, default: null },
  },
  { timestamps: true },
);

reservationSchema.virtual("guest", {
  ref: "Guest",
  localField: "guestId",
  foreignField: "_id",
  justOne: true,
});

reservationSchema.virtual("roomType", {
  ref: "RoomType",
  localField: "roomTypeId",
  foreignField: "_id",
  justOne: true,
});

reservationSchema.virtual("room", {
  ref: "Room",
  localField: "roomId",
  foreignField: "_id",
  justOne: true,
});

reservationSchema.virtual("stay", {
  ref: "Stay",
  localField: "_id",
  foreignField: "reservationId",
  justOne: true,
});

applyIdTransform(reservationSchema);

export type ReservationDocument = InferSchemaType<typeof reservationSchema> & {
  _id: mongoose.Types.ObjectId;
  id: string;
  stay?: unknown;
};

export const Reservation =
  (mongoose.models.Reservation as mongoose.Model<ReservationDocument>) ||
  mongoose.model<ReservationDocument>("Reservation", reservationSchema);
