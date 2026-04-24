// DTO for PATCH /users/:id — all fields are optional (partial update).
// Role changes are accepted in the DTO but stripped by the controller
// unless the requester is an admin.

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  // Changing this field requires admin privileges — enforced in UsersController
  @ApiPropertyOptional({ enum: ['user', 'provider', 'admin'] })
  @IsOptional()
  @IsEnum(['user', 'provider', 'admin'])
  role?: string;
}
