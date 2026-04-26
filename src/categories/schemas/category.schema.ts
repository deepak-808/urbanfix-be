// Mongoose schema for the Category collection.
// Categories are seeded once and managed by admins via the API.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  // Unique category names prevent duplicates (e.g. two "Plumbing" categories)
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  // Lucide icon component name stored as a string key (e.g. "AirVent", "Droplets")
  // Resolved to an actual component in the frontend's CategoryCard
  @Prop({ required: true, trim: true })
  icon: string;

  @Prop({ trim: true })
  description: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
