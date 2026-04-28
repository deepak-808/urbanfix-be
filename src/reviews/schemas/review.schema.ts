// Mongoose schema for the Review collection.
// Enforces one-review-per-user-per-provider via a compound unique index.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  // The user who wrote the review — populated with name/avatar in list queries
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // The provider being reviewed — populated to verify the provider exists on create
  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  providerId: Types.ObjectId;

  // 1–5 integer star rating
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  // Free-text review body, capped at 1000 characters
  @Prop({ required: true, trim: true, maxlength: 1000 })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Prevents the same user from submitting multiple reviews for one provider
ReviewSchema.index({ userId: 1, providerId: 1 }, { unique: true });
