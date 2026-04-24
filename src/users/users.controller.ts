// REST controller for the /users resource.
// All routes require JWT authentication.
// Admin-only routes are further restricted by @Roles('admin') + RolesGuard.

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService, serializeUser } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.types';

@ApiTags('Users')
@ApiBearerAuth()
// All routes in this controller require a valid JWT + the roles guard applied
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin only — returns all users
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (admin)' })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(serializeUser);
  }

  // Users can only fetch their own profile; admins can fetch any user
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() me: JwtPayload) {
    if (me.role !== 'admin' && me.sub !== id) {
      throw new ForbiddenException('Access denied.');
    }
    const user = await this.usersService.findById(id);
    return serializeUser(user);
  }

  // Users can only update their own profile; admins can update any user.
  // Role changes are silently stripped for non-admin callers.
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() me: JwtPayload,
  ) {
    if (me.role !== 'admin' && me.sub !== id) {
      throw new ForbiddenException('Access denied.');
    }
    // Only admin can change roles; silently strip the field for regular users
    if (dto.role && me.role !== 'admin') delete dto.role;
    const user = await this.usersService.update(id, dto);
    return serializeUser(user);
  }

  // Admin only — permanently deletes the user account
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (admin)' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted.' };
  }
}
