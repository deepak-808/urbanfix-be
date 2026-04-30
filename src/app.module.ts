// Root NestJS application module.
// Wires together all feature modules and configures global providers
// (env config and MongoDB connection).

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    // Makes process.env variables available globally without importing ConfigModule in each module
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB connection — falls back to a local DB for development
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/urbanfix',
    ),

    // Feature modules — each encapsulates its own schema, service and controller
    AuthModule,
    UsersModule,
    ProvidersModule,
    CategoriesModule,
    ReviewsModule,
    BookingsModule,
  ],
})
export class AppModule {}
