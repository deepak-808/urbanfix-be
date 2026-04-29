// Bookings service — role-scoped list, creation, status transitions, and cancellation.
// Access is automatically scoped by the requester's role:
//   user     → sees only their own bookings
//   provider → sees bookings made for their profile
//   admin    → sees all bookings

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtPayload } from '../auth/auth.types';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  // Returns paginated bookings scoped to the requester's role.
  // Users see their own; providers see bookings for their profile; admins see all.
  async findAll(requester: JwtPayload, query: { status?: string; page?: number; limit?: number }) {
    const filter: FilterQuery<Booking> = {};

    if (requester.role === 'user') filter.userId = requester.sub as any;
    else if (requester.role === 'provider') filter.providerId = requester.sub as any;
    // admin: no filter — sees all bookings

    if (query.status) filter.status = query.status;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('userId', 'name email phone')
        .populate('providerId', 'businessName location phone')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit),
      this.bookingModel.countDocuments(filter),
    ]);

    return { data: bookings, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Returns a single booking — only accessible to the user, provider, or admin
  async findById(id: string, requester: JwtPayload): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('userId', 'name email phone')
      .populate('providerId', 'businessName location phone');
    if (!booking) throw new NotFoundException('Booking not found.');

    if (
      requester.role !== 'admin' &&
      booking.userId.toString() !== requester.sub &&
      booking.providerId.toString() !== requester.sub
    ) {
      throw new ForbiddenException('Access denied.');
    }
    return booking;
  }

  // Creates a new booking — scheduled time must be strictly in the future
  async create(dto: CreateBookingDto, userId: string): Promise<BookingDocument> {
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future.');
    }

    const booking = new this.bookingModel({ ...dto, userId });
    return (await booking.save()).populate('providerId', 'businessName location phone');
  }

  // Updates the booking status with role-based restrictions:
  //   users    → can only cancel their own bookings
  //   providers → can confirm, start, complete, or cancel their bookings
  //   admins   → can set any status on any booking
  async updateStatus(
    id: string,
    status: BookingStatus,
    requester: JwtPayload,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found.');

    if (requester.role === 'user') {
      if (booking.userId.toString() !== requester.sub) {
        throw new ForbiddenException('Access denied.');
      }
      // Users are only allowed to cancel — they cannot confirm or complete
      if (status !== 'cancelled') {
        throw new ForbiddenException('Users can only cancel bookings.');
      }
    }

    if (requester.role === 'provider') {
      if (booking.providerId.toString() !== requester.sub) {
        throw new ForbiddenException('Access denied.');
      }
      // Providers can set any status for their own bookings
    }

    booking.status = status;
    return (await booking.save()).populate('providerId', 'businessName location');
  }

  // Convenience wrapper — delegates to updateStatus with 'cancelled'
  async cancel(id: string, requester: JwtPayload): Promise<BookingDocument> {
    return this.updateStatus(id, 'cancelled', requester);
  }
}
