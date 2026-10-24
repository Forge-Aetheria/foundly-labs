import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

export const PushPlatform = {
  IOS: 'IOS',
  ANDROID: 'ANDROID',
} as const;

export type PushPlatform = (typeof PushPlatform)[keyof typeof PushPlatform];

registerEnumType(PushPlatform, { name: 'PushPlatform' });

@ObjectType()
export class PushTokenObject {
  @Field(() => ID)
  id!: string;

  @Field(() => PushPlatform)
  platform!: PushPlatform;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String)
  updatedAt!: string;
}

@InputType()
export class RegisterPushTokenInput {
  @Field(() => String)
  token!: string;

  @Field(() => PushPlatform)
  platform!: PushPlatform;

  @Field(() => String, { nullable: true })
  deviceId?: string | null;
}
