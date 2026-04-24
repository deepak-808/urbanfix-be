// Mongoose schema for the User collection.
// Passwords are never stored in plain text — only bcrypt hashes are persisted.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// HydratedDocument includes Mongoose document methods (save, toObject, etc.)
export type UserDocument = HydratedDocument<User>;

// timestamps: true automatically adds createdAt / updatedAt fields
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  // Stored lowercase for case-insensitive lookups; unique constraint prevents duplicate accounts
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  // bcrypt hash — never expose this field in API responses (stripped in serializeUser)
  @Prop({ required: true })
  passwordHash: string;

  // Defaults to 'user'; admins are created manually or via DB
  @Prop({ enum: ['user', 'provider', 'admin'], default: 'user' })
  role: string;

  // Optional profile picture URL
  @Prop()
  avatar: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
