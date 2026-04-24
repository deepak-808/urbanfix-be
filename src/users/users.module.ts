// Users feature module.
// Exports UsersService so AuthModule can use it for login/register flows.

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService],
  // Exported so AuthModule can inject UsersService for credential validation
  exports: [UsersService],
})
export class UsersModule {}
