import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MyService {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  priceCents!: number;

  @Field(() => Int)
  durationMinutes!: number;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Boolean)
  active!: boolean;
}

@InputType()
export class CreateMyServiceInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  priceCents: number;

  @Field(() => Int)
  durationMinutes: number;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;

  constructor() {
    this.name = '';
    this.priceCents = 0;
    this.durationMinutes = 0;
  }
}

@InputType()
export class UpdateMyServiceInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int, { nullable: true })
  priceCents?: number | null;

  @Field(() => Int, { nullable: true })
  durationMinutes?: number | null;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;
}

@ObjectType()
export class MySpecialist {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  role?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => Boolean)
  active!: boolean;
}

@InputType()
export class CreateMySpecialistInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  role?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;

  constructor() {
    this.name = '';
  }
}

@InputType()
export class UpdateMySpecialistInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  role?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | null;
}