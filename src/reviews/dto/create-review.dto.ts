// DTO for POST /reviews — authenticated users only.
// Rating must be an integer between 1 and 5.

import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  // The provider being reviewed (MongoDB ObjectId string)
  @ApiProperty({ description: 'Provider ObjectId' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  // Integer rating — enforced by @IsInt() to prevent 4.5-style inputs
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;
}
