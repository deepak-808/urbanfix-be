// Mongoose schema for the Booking collection.
// A booking links a user to a provider for a specific service at a scheduled time.
// Status transitions: pending → confirmed → in_progress → completed (or cancelled at any stage).

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

// All valid booking lifecycle states
export type BookingStatus =
  | 'pending'       // submitted by user, awaiting provider confirmation
  | 'confirmed'     // accepted by provider
  | 'in_progress'   // provider has started the job
  | 'completed'     // job finished
  | 'cancelled';    // cancelled by user or provider

@Schema({ timestamps: true })
export class Booking {
  // The customer who made the booking
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // The service provider fulfilling the booking
  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  providerId: Types.ObjectId;

  // Snapshot of the service name at booking time (provider may rename services later)
  @Prop({ required: true, trim: true })
  serviceName: string;

  // Snapshot of the agreed price at booking time
  @Prop({ required: true, min: 0 })
  servicePrice: number;

  // The requested appointment date/time — must be in the future on creation
  @Prop({ required: true })
  scheduledAt: Date;

  // Optional service address (defaults to the provider's listed location)
  @Prop({ trim: true })
  address: string;

  // Optional customer notes or special instructions
  @Prop({ trim: true })
  notes: string;

  @Prop({
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: BookingStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
