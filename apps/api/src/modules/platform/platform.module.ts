import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { SuperAdminGuard } from './platform.guard';
import {
  PLATFORM_IDENTITY,
  SupabaseAdminIdentityClient,
} from './platform.identity';
import { PlatformResolver } from './platform.resolver';
import { PlatformService } from './platform.service';
import { PLATFORM_STORE, PrismaPlatformStore } from './platform.store';

@Module({
  imports: [SharedPrismaModule],
  providers: [
    { provide: PLATFORM_STORE, useClass: PrismaPlatformStore },
    { provide: PLATFORM_IDENTITY, useClass: SupabaseAdminIdentityClient },
    PlatformService,
    PlatformResolver,
    SuperAdminGuard,
  ],
  exports: [PlatformService, SuperAdminGuard],
})
export class PlatformModule {}
