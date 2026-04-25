// Authentication service — handles user registration and login.
// Issues JWT tokens that clients store and send in the Authorization header.

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, serializeUser } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Creates a user account and immediately returns a JWT so the client is logged in.
  // Throws ConflictException (via UsersService) if the email is already taken.
  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);

    const payload: JwtPayload = {
      sub: user._id.toString(), // MongoDB ObjectId → string for JWT `sub` claim
      name: user.name,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };

    return {
      user: serializeUser(user), // strip passwordHash before returning
      token: this.jwtService.sign(payload),
    };
  }

  // Verifies credentials and returns a JWT on success.
  // Both "email not found" and "wrong password" return the same error message
  // to prevent email enumeration attacks.
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password.');

    const valid = await this.usersService.validatePassword(user, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password.');

    const payload: JwtPayload = {
      sub: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };

    return {
      user: serializeUser(user),
      token: this.jwtService.sign(payload),
    };
  }
}
