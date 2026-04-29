// Bookings REST controller — all routes require authentication.
// Access scoping (user vs provider vs admin) is handled in BookingsService.

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.types';

@ApiTags('Bookings')
@ApiBearerAuth()
// All routes require JWT — no public endpoints in this module
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Results are automatically scoped by the caller's role in the service layer
  @Get()
  @ApiOperation({ summary: 'List bookings (scoped by role)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() me: JwtPayload,
    @Query() query: { status?: string; page?: number; limit?: number },
  ) {
    return this.bookingsService.findAll(me, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by ID' })
  findOne(@Param('id') id: string, @CurrentUser() me: JwtPayload) {
    return this.bookingsService.findById(id, me);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() me: JwtPayload) {
    return this.bookingsService.create(dto, me.sub);
  }

  // Separate status endpoint keeps PATCH / semantics clear (full update vs status change)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() me: JwtPayload,
  ) {
    return this.bookingsService.updateStatus(id, dto.status, me);
  }

  // Convenience endpoint — equivalent to PATCH /:id/status with status=cancelled
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancel(@Param('id') id: string, @CurrentUser() me: JwtPayload) {
    return this.bookingsService.cancel(id, me);
  }
}
