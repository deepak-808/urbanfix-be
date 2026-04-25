// Auth controller — exposes three public-ish endpoints:
//   POST /auth/register — create a new account
//   POST /auth/login    — exchange credentials for a JWT
//   GET  /auth/me       — return the current user's profile (JWT required)

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService, serializeUser } from '../users/users.service';
import { JwtPayload } from './auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Re-fetches the user from the DB so any profile updates made since login are reflected
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    return serializeUser(user);
  }
}
