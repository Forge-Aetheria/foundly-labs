import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { TenantsResolver } from './tenants.resolver';
import { TenantsService } from './tenants.service';

@Module({
  imports: [SharedPrismaModule],
  providers: [TenantsService, TenantsResolver],
})
export class TenantsModule {}
