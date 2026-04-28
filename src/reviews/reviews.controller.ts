// Reviews REST controller.
// GET /reviews?providerId=... is public (no auth required).
// POST and DELETE require a valid JWT.

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.types';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Public — used by the provider profile page to display reviews
  @Get()
  @ApiOperation({ summary: 'Get reviews for a provider' })
  @ApiQuery({ name: 'providerId', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByProvider(
    @Query('providerId') providerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findByProvider(providerId, page, limit);
  }

  // Authenticated — any logged-in user can leave a review for a provider
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a review (authenticated user)' })
  create(@Body() dto: CreateReviewDto, @CurrentUser() me: JwtPayload) {
    return this.reviewsService.create(dto, me.sub);
  }

  // Authenticated — the review owner or an admin can delete a review
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (owner or admin)' })
  async remove(@Param('id') id: string, @CurrentUser() me: JwtPayload) {
    await this.reviewsService.remove(id, me);
    return { message: 'Review deleted.' };
  }
}
