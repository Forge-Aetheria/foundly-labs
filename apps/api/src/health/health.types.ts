import { Field, ObjectType } from '@nestjs/graphql';

/** Public health payload: liveness (status) + data-layer readiness (database). */
@ObjectType()
export class HealthPayload {
  @Field(() => String)
  service!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  database!: string;

  @Field(() => String)
  checkedAt!: string;
}