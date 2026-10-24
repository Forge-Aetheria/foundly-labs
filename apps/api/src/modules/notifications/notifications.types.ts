import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

/** Closed set of notification types (mirrors the Prisma enum). */
export const NotificationType = {
  NEW_BOOKING: 'NEW_BOOKING',
  RESCHEDULE_REQUEST: 'RESCHEDULE_REQUEST',
  SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  SYSTEM_INFO: 'SYSTEM_INFO',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

registerEnumType(NotificationType, { name: 'NotificationType' });

/** A tenant-scoped in-app notification. */
@ObjectType()
export class NotificationObject {
  @Field(() => ID)
  id!: string;

  @Field(() => NotificationType)
  type!: NotificationType;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  message!: string;

  @Field(() => Boolean)
  read!: boolean;

  @Field(() => String)
  createdAt!: string;
}
