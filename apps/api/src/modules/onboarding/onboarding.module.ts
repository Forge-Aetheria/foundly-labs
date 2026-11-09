import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { OnboardingResolver } from './onboarding.resolver';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [TenantsModule],
  providers: [OnboardingService, OnboardingResolver],
})
export class OnboardingModule {}
