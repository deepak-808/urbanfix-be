// Auth feature module.
// Wires together JWT signing, Passport, the strategy, and the auth service.
// Exports JwtModule so other modules can sign/verify tokens if needed.

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule, // provides UsersService for credential validation
    PassportModule,
    JwtModule.register({
      // In production, override JWT_SECRET with a long random string via env
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      // Tokens expire after 7 days — configurable via JWT_EXPIRES_IN env var
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
