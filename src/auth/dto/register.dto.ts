// DTO for POST /auth/register — validated by NestJS ValidationPipe.
// Only 'user' and 'provider' roles can be self-assigned;
// 'admin' accounts must be created directly in the database.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1 (555) 000-0000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  // Minimum 6 characters — enforced by both validator and client-side form
  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  // Defaults to 'user' if omitted — prevents self-assigning admin role
  @ApiPropertyOptional({ enum: ['user', 'provider'], default: 'user' })
  @IsOptional()
  @IsEnum(['user', 'provider'])
  role?: 'user' | 'provider';
}
