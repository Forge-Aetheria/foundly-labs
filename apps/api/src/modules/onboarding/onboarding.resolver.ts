import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { OnboardingService } from './onboarding.service';
import {
  RegisterBusinessInput,
  RegisterBusinessResult,
} from './onboarding.types';

@Resolver(() => RegisterBusinessResult)
export class OnboardingResolver {
  constructor(private readonly onboardingService: OnboardingService) {}

  /** Public registration: creates account + tenant + binding server-side. */
  @Mutation(() => RegisterBusinessResult)
  registerBusiness(
    @Args('input', { type: () => RegisterBusinessInput }) input: RegisterBusinessInput,
  ): Promise<RegisterBusinessResult> {
    return this.onboardingService.register(input);
  }
}
