import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType('ServiceRef')
export class ServiceRefObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;
}

@ObjectType('Specialist')
export class SpecialistObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tenantId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  role?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => Boolean)
  active!: boolean;

  @Field(() => [ServiceRefObject])
  services!: ServiceRefObject[];
}

@InputType()
export class CreateSpecialistInput {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  role?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;

  @Field(() => String, { nullable: true })
  tenantId?: string | null;

  @Field(() => String, { nullable: true })
  tenantSlug?: string | null;
}

@InputType()
export class UpdateSpecialistInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  role?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;
}
