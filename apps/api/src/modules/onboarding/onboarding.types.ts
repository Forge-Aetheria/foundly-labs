import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class RegisterBusinessAccountInput {
  @Field(() => String)
  fullName!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  password!: string;
}

@InputType()
export class RegisterBusinessBusinessInput {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  category!: string;

  @Field(() => String)
  slug!: string;
}

@InputType()
export class RegisterBusinessInput {
  @Field(() => RegisterBusinessAccountInput)
  account!: RegisterBusinessAccountInput;

  @Field(() => RegisterBusinessBusinessInput)
  business!: RegisterBusinessBusinessInput;
}

@ObjectType()
export class RegisterBusinessResult {
  @Field(() => ID)
  tenantId!: string;
}
