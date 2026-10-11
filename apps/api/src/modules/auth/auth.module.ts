import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GqlAuthGuard, PlanGuard } from './auth.guards';
import { AuthResolver } from './auth.resolver';

@Global()
@Module({
  providers: [AuthService, GqlAuthGuard, PlanGuard, AuthResolver],
  exports: [AuthService, GqlAuthGuard, PlanGuard],
})
export class AuthModule {}
