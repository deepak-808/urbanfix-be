// Mongoose schema for the Provider collection.
// Each provider profile belongs to exactly one user account (1:1 via userId unique index).
// Services are embedded as an array of sub-documents so they can be
// updated atomically without a separate collection.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProviderDocument = HydratedDocument<Provider>;

// Embedded sub-document — not a separate Mongoose model
class ServiceItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  // Pricing unit shown in the UI, e.g. "per visit", "per hour"
  @Prop({ default: 'per visit' })
  unit: string;

  // Estimated job duration, e.g. "1-2 hours"
  @Prop()
  duration: string;
}

@Schema({ timestamps: true })
export class Provider {
  // References User._id — unique ensures one provider profile per user account
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  businessName: string;

  // References Category._id — populated as an object in list/detail queries
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ trim: true })
  bio: string;

  // Embedded services array — updated in full (replace semantics, not append)
  @Prop({ type: [ServiceItem], default: [] })
  services: ServiceItem[];

  // Maintained by ReviewsService.recalculateRating() after every review add/delete
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  // Flipped by admin via PATCH /providers/:id/verify or /unverify
  @Prop({ default: false })
  verified: boolean;

  // Array of work-sample image URLs (Unsplash, CDN, etc.)
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  experience: string;

  @Prop({ trim: true })
  availability: string;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
