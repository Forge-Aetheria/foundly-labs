import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BusinessProfileObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  instagram?: string | null;

  @Field(() => String, { nullable: true })
  whatsapp?: string | null;

  @Field(() => String, { nullable: true })
  logo?: string | null;

  @Field(() => String, { nullable: true })
  cover?: string | null;

  @Field(() => String, { nullable: true })
  brandColors?: string | null;

  @Field(() => String, { nullable: true })
  policies?: string | null;
}

@ObjectType()
export class ServiceObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  durationMinutes!: number;

  @Field(() => Int)
  priceCents!: number;

  @Field(() => String)
  currency!: string;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Boolean)
  active!: boolean;
}

@ObjectType()
export class TenantObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  category!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  timezone!: string;

  @Field(() => String)
  currency!: string;

  @Field(() => BusinessProfileObject, { nullable: true })
  profile?: BusinessProfileObject | null;

  @Field(() => [ServiceObject])
  services!: ServiceObject[];
}

@InputType()
export class BusinessProfileInput {
  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  instagram?: string | null;

  @Field(() => String, { nullable: true })
  whatsapp?: string | null;

  @Field(() => String, { nullable: true })
  logo?: string | null;

  @Field(() => String, { nullable: true })
  cover?: string | null;

  @Field(() => String, { nullable: true })
  brandColors?: string | null;

  @Field(() => String, { nullable: true })
  policies?: string | null;
}

@InputType()
export class CreateTenantInput {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  category!: string;

  @Field(() => String)
  timezone!: string;

  @Field(() => String, { nullable: true })
  currency?: string | null;

  @Field(() => BusinessProfileInput)
  profile!: BusinessProfileInput;
}
