import { Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { SubscriptionService } from './subscription.service';
import { SubscriptionSummaryObject } from './subscription.types';

@Resolver(() => SubscriptionSummaryObject)
export class SubscriptionResolver {
  constructor(private readonly service: SubscriptionService) {}

  /** Authenticated: the caller business's effective plan, status, expiry and usage. */
  @Query(() => SubscriptionSummaryObject)
  @RequireAuth()
  mySubscription(@AuthUserDecorator() user: AuthUser): Promise<SubscriptionSummaryObject> {
    return this.service.getSummary(user);
  }
}
