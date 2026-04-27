// Service layer for provider profiles.
// Handles listing with filters, CRUD, and admin verification actions.
// Also exposes updateRating() which ReviewsService calls after every review change.

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { JwtPayload } from '../auth/auth.types';

// Query parameters accepted by the list endpoint
export interface ProviderQuery {
  categoryId?: string;
  location?: string;
  verified?: boolean;
  minRating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
  ) {}

  // Returns a paginated list of providers matching the given filters.
  // Results are sorted by rating desc, then review count desc (best-rated first).
  async findAll(query: ProviderQuery = {}) {
    const filter: FilterQuery<Provider> = {};

    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.verified !== undefined) filter.verified = query.verified;
    if (query.minRating) filter.rating = { $gte: Number(query.minRating) };
    if (query.location) {
      filter.location = { $regex: query.location, $options: 'i' };
    }
    // Full-text-style search across business name, bio, and location
    if (query.search) {
      filter.$or = [
        { businessName: { $regex: query.search, $options: 'i' } },
        { bio: { $regex: query.search, $options: 'i' } },
        { location: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Cap at 50 results per page to avoid over-fetching
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    // Run count and find in parallel to avoid waterfall latency
    const [providers, total] = await Promise.all([
      this.providerModel
        .find(filter)
        .populate('categoryId', 'name icon')   // resolve category name for display
        .populate('userId', 'name email')       // resolve owner name
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(limit),
      this.providerModel.countDocuments(filter),
    ]);

    return {
      data: providers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ProviderDocument> {
    const provider = await this.providerModel
      .findById(id)
      .populate('categoryId', 'name icon')
      .populate('userId', 'name email avatar');
    if (!provider) throw new NotFoundException('Provider not found.');
    return provider;
  }

  // Used by GET /providers/me — returns null if the user hasn't set up a profile yet
  async findByUserId(userId: string): Promise<ProviderDocument | null> {
    return this.providerModel.findOne({ userId }).populate('categoryId', 'name icon');
  }

  // One user can only have one provider profile (enforced by the schema unique index on userId)
  async create(dto: CreateProviderDto, userId: string): Promise<ProviderDocument> {
    const existing = await this.providerModel.findOne({ userId });
    if (existing) throw new ConflictException('Provider profile already exists for this account.');

    const provider = new this.providerModel({ ...dto, userId });
    return (await provider.save()).populate('categoryId', 'name icon');
  }

  // Only the profile owner or an admin can update — enforced here rather than in a guard
  // to avoid a second DB round-trip in the controller
  async update(
    id: string,
    dto: UpdateProviderDto,
    requester: JwtPayload,
  ): Promise<ProviderDocument> {
    const provider = await this.providerModel.findById(id);
    if (!provider) throw new NotFoundException('Provider not found.');

    if (
      requester.role !== 'admin' &&
      provider.userId.toString() !== requester.sub
    ) {
      throw new ForbiddenException('Access denied.');
    }

    Object.assign(provider, dto);
    return (await provider.save()).populate('categoryId', 'name icon');
  }

  // Admin: mark a provider as verified
  async verify(id: string): Promise<ProviderDocument> {
    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { verified: true },
      { new: true },
    );
    if (!provider) throw new NotFoundException('Provider not found.');
    return provider;
  }

  // Admin: revoke a provider's verified status
  async unverify(id: string): Promise<ProviderDocument> {
    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { verified: false },
      { new: true },
    );
    if (!provider) throw new NotFoundException('Provider not found.');
    return provider;
  }

  // Only the profile owner or an admin can delete
  async remove(id: string, requester: JwtPayload): Promise<void> {
    const provider = await this.providerModel.findById(id);
    if (!provider) throw new NotFoundException('Provider not found.');

    if (
      requester.role !== 'admin' &&
      provider.userId.toString() !== requester.sub
    ) {
      throw new ForbiddenException('Access denied.');
    }

    await provider.deleteOne();
  }

  // Called by ReviewsService after every review insert or delete to keep the
  // rating and reviewCount fields in sync with the actual reviews collection.
  async updateRating(id: string, avgRating: number, reviewCount: number) {
    await this.providerModel.findByIdAndUpdate(id, {
      // Round to 1 decimal place (e.g. 4.75 → 4.8)
      rating: Math.round(avgRating * 10) / 10,
      reviewCount,
    });
  }
}
