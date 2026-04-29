// DTO for POST /bookings.
// The scheduledAt must be a future ISO 8601 date — enforced in BookingsService.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  // Target provider (MongoDB ObjectId string)
  @ApiProperty({ description: 'Provider ObjectId' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  // Snapshot of the chosen service name
  @ApiProperty({ example: 'AC Servicing' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  // Agreed price at booking time
  @ApiProperty({ example: 45 })
  @IsNumber()
  @Min(0)
  servicePrice: number;

  // ISO 8601 datetime string — must be strictly in the future (validated in service)
  @ApiProperty({ example: '2025-07-10T09:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: '123 Main St, New York' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
