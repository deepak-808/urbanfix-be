// Providers REST controller.
// Public endpoints: GET /providers (list) and GET /providers/:id (detail).
// Authenticated endpoints: POST (create), PATCH (update), DELETE.
// Admin-only endpoints: PATCH /:id/verify and PATCH /:id/unverify.

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ProvidersService, ProviderQuery } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.types';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // Public — used by the services discovery page and homepage hero
  @Get()
  @ApiOperation({ summary: 'List providers with optional filters' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: ProviderQuery) {
    return this.providersService.findAll(query);
  }

  // Authenticated — returns the provider profile of the currently logged-in user.
  // Returns null (not 404) if the user hasn't created a profile yet,
  // so the frontend can redirect to /provider/setup.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current provider profile' })
  getMyProfile(@CurrentUser() me: JwtPayload) {
    return this.providersService.findByUserId(me.sub);
  }

  // Public — used by the provider profile page
  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  findOne(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  // Provider or admin can create a profile (one per user)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create provider profile (provider/admin)' })
  create(@Body() dto: CreateProviderDto, @CurrentUser() me: JwtPayload) {
    return this.providersService.create(dto, me.sub);
  }

  // Owner or admin can update; ownership check is in the service layer
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update provider (owner or admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
    @CurrentUser() me: JwtPayload,
  ) {
    return this.providersService.update(id, dto, me);
  }

  // Admin only — grant verification badge
  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a provider (admin)' })
  verify(@Param('id') id: string) {
    return this.providersService.verify(id);
  }

  // Admin only — revoke verification badge
  @Patch(':id/unverify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke provider verification (admin)' })
  unverify(@Param('id') id: string) {
    return this.providersService.unverify(id);
  }

  // Owner or admin can delete; ownership check is in the service layer
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete provider (owner or admin)' })
  async remove(@Param('id') id: string, @CurrentUser() me: JwtPayload) {
    await this.providersService.remove(id, me);
    return { message: 'Provider deleted.' };
  }
}
