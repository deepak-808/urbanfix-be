// Reviews service — handles listing, creation, deletion, and rating recalculation.
// After every review create or delete, the provider's aggregated rating is
// recalculated via an aggregation pipeline and written back to the Provider document.

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProvidersService } from '../providers/providers.service';
import { JwtPayload } from '../auth/auth.types';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    // Injected to verify provider existence and to update the cached rating
    private providersService: ProvidersService,
  ) {}

  // Returns paginated reviews for a provider, newest first.
  // The frontend populates userName from the userId sub-document.
  async findByProvider(
    providerId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (Math.max(1, page) - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ providerId })
        .populate('userId', 'name avatar') // resolve display name and avatar
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.reviewModel.countDocuments({ providerId }),
    ]);
    return { data: reviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Creates a review and immediately recalculates the provider's average rating.
  // Throws if the provider doesn't exist or if the user has already reviewed them.
  async create(dto: CreateReviewDto, userId: string): Promise<ReviewDocument> {
    // Validate that the target provider exists (throws 404 if not)
    await this.providersService.findById(dto.providerId);

    // Enforce one-review-per-user-per-provider at the application layer
    // (the DB unique index is a safety net)
    const existing = await this.reviewModel.findOne({
      userId,
      providerId: dto.providerId,
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this provider.');
    }

    const review = await new this.reviewModel({
      ...dto,
      userId,
    }).save();

    // Keep the provider's cached rating up to date after every new review
    await this.recalculateRating(dto.providerId);
    return review.populate('userId', 'name avatar');
  }

  // Deletes a review (owner or admin) and recalculates the provider's rating.
  async remove(id: string, requester: JwtPayload): Promise<void> {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found.');

    if (
      requester.role !== 'admin' &&
      review.userId.toString() !== requester.sub
    ) {
      throw new ForbiddenException('Access denied.');
    }

    const providerId = review.providerId.toString();
    await review.deleteOne();
    // Recalculate after deletion so the provider's rating reflects the removal
    await this.recalculateRating(providerId);
  }

  // Aggregates the current average rating and count from the reviews collection
  // and writes the result back to the Provider document.
  private async recalculateRating(providerId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { providerId: new (require('mongoose').Types.ObjectId)(providerId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    // If no reviews remain, reset rating to 0
    const avg = result[0]?.avg ?? 0;
    const count = result[0]?.count ?? 0;
    await this.providersService.updateRating(providerId, avg, count);
  }
}
