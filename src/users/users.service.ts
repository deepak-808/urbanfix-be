// Service layer for user management.
// Handles creation, lookup, update, deletion, and password validation.

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Strips sensitive fields before returning user data to the client.
// Always use this instead of returning the raw Mongoose document.
export function serializeUser(user: UserDocument) {
  const obj = user.toObject({ virtuals: true }); // include Mongoose virtual `id`
  delete obj.passwordHash;  // never expose the bcrypt hash
  delete obj.__v;           // remove Mongoose version key
  return obj;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Creates a new user account.
  // Email uniqueness is enforced at the schema level (unique index) and here for a cleaner error.
  async create(dto: RegisterDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase().trim(),
    });
    if (existing) throw new ConflictException('Email already registered.');

    // Hash cost of 10 — good balance between security and latency (~100ms on modern hardware)
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone.trim(),
      passwordHash,
      role: dto.role ?? 'user',
    });
    return user.save();
  }

  // Used by AuthService.login() — returns null when the email doesn't exist
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  // Used by AuthController.me() and guards that need the full user document
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  // Admin: list all users, newest first
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('User not found.');
  }

  // Compares a plain-text password against the stored bcrypt hash.
  // Returns true on a match, false otherwise — never throws.
  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
