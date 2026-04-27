// DTO for POST /providers — creates a new provider profile.
// The `services` array is validated recursively via @ValidateNested + @Type.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Nested DTO for each service item in the services array
export class ServiceItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  // e.g. "per visit", "per hour", "flat rate"
  @ApiPropertyOptional({ default: 'per visit' })
  @IsOptional()
  @IsString()
  unit?: string;

  // e.g. "1-2 hours"
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;
}

export class CreateProviderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessName: string;

  // Must be a valid Category ObjectId — referenced via the Category schema
  @ApiProperty({ description: 'Category ObjectId' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  // Transform empty string to undefined so @IsEmail() doesn't reject blank inputs
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availability?: string;

  // Each item in the array is validated against ServiceItemDto
  @ApiPropertyOptional({ type: [ServiceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  services?: ServiceItemDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];
}
