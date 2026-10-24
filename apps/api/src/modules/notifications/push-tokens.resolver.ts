import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { PushTokensService } from './push-tokens.service';
import { PushTokenObject, RegisterPushTokenInput } from './push-tokens.types';

@Resolver(() => PushTokenObject)
export class PushTokensResolver {
  constructor(private readonly service: PushTokensService) {}

  @Mutation(() => PushTokenObject)
  @RequireAuth()
  async registerPushToken(
    @AuthUserDecorator() user: AuthUser,
    @Args('input', { type: () => RegisterPushTokenInput }) input: RegisterPushTokenInput,
  ): Promise<PushTokenObject> {
    const row = await this.service.register(user, input);
    return {
      id: row.id,
      platform: row.platform,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  @Mutation(() => Boolean)
  @RequireAuth()
  unregisterPushToken(
    @AuthUserDecorator() user: AuthUser,
    @Args('token') token: string,
  ): Promise<boolean> {
    return this.service.unregister(user, token);
  }
}
