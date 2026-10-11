import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('CurrentTenant')
export class CurrentTenantObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String, { nullable: true })
  plan?: string | null;
}

@ObjectType('CurrentUser')
export class CurrentUserObject {
  @Field(() => ID)
  userId!: string;

  @Field(() => String)
  role!: string;

  @Field(() => CurrentTenantObject)
  tenant!: CurrentTenantObject;
}

@ObjectType('BookCapability')
export class BookCapabilityObject {
  @Field(() => ID)
  tenantId!: string;

  @Field(() => Boolean)
  enabled!: boolean;
}
