import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import type { AuthContext, AuthTenant } from './auth.context';
import { getAuthRequest, GqlAuthGuard, PlanGuard, REQUIRED_PLANS_KEY } from './auth.guards';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext | undefined =>
    getAuthRequest(context).authContext,
);

export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthTenant | undefined =>
    getAuthRequest(context).authContext?.tenant,
);

export function UseAuth(): MethodDecorator {
  return applyDecorators(UseGuards(GqlAuthGuard));
}

export function RequirePlan(...plans: string[]): MethodDecorator {
  return applyDecorators(
    SetMetadata(REQUIRED_PLANS_KEY, plans),
    UseGuards(GqlAuthGuard, PlanGuard),
  );
}
