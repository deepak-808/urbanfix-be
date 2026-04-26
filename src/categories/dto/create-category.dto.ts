// DTO for POST /categories (admin only).

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Plumbing' })
  @IsString()
  @IsNotEmpty()
  name: string;

  // Must match a key in the frontend's iconMap (CategoryCard component)
  @ApiProperty({ example: 'Droplets' })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiPropertyOptional({ example: 'Pipe repairs and installations' })
  @IsOptional()
  @IsString()
  description?: string;
}
