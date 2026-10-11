import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql';

@ObjectType()
export class HealthPayload {
  @Field(() => String)
  service!: string;

  @Field(() => String)
  status!: string;
}

/** Public health query; intentionally has no database dependency. */
@Resolver()
export class HealthResolver {
  @Query(() => HealthPayload)
  health(): HealthPayload {
    return { service: 'foundly-api', status: 'ok' };
  }
}
