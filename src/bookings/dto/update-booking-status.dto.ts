// DTO for PATCH /bookings/:id/status.
// Only valid BookingStatus values are accepted — enforced by @IsEnum.

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  })
  @IsEnum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}
