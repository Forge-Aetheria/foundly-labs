import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentMethodType } from '../payments/payments.types';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

registerEnumType(AppointmentStatus, { name: 'AppointmentStatus' });

@ObjectType('AppointmentService')
export class AppointmentServiceObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;
}

@ObjectType('AppointmentSpecialist')
export class AppointmentSpecialistObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;
}

@ObjectType('AppointmentNotificationObject')
export class AppointmentNotificationObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  kind!: string;

  @Field(() => String)
  message!: string;

  @Field(() => String)
  channel!: string;

  @Field(() => String)
  createdAt!: string;
}

@ObjectType('PublicAppointment')
export class PublicAppointmentObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  specialistId!: string;

  @Field(() => GraphQLISODateTime)
  startAt!: Date;

  @Field(() => GraphQLISODateTime)
  endAt!: Date;

  @Field(() => AppointmentStatus)
  status!: AppointmentStatus;
}

@ObjectType('Appointment')
export class AppointmentObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tenantId!: string;

  @Field(() => String)
  serviceId!: string;

  @Field(() => String)
  specialistId!: string;

  @Field(() => String)
  clientName!: string;

  @Field(() => String, { nullable: true })
  clientContact?: string | null;

  @Field(() => GraphQLISODateTime)
  startAt!: Date;

  @Field(() => GraphQLISODateTime)
  endAt!: Date;

  @Field(() => AppointmentStatus)
  status!: AppointmentStatus;

  @Field(() => Int)
  appliedDurationMinutes!: number;

  @Field(() => Int)
  appliedAmountCents!: number;

  @Field(() => String)
  appliedCurrency!: string;

  @Field(() => String)
  origin!: string;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String, { nullable: true })
  cancellationReason?: string | null;

  @Field(() => PaymentMethodType, { nullable: true })
  paymentMethodType?: PaymentMethodType | null;

  @Field(() => Int, { nullable: true })
  advanceAmountCents?: number | null;

  @Field(() => String, { nullable: true })
  paymentReference?: string | null;

  @Field(() => String, { nullable: true })
  paymentProofUrl?: string | null;

  @Field(() => String, { nullable: true })
  paymentSubmittedAt?: string | null;

  @Field(() => [AppointmentNotificationObject])
  notifications!: AppointmentNotificationObject[];

  @Field(() => AppointmentServiceObject)
  service!: AppointmentServiceObject;

  @Field(() => AppointmentSpecialistObject)
  specialist!: AppointmentSpecialistObject;
}

@InputType()
export class CreateAppointmentInput {
  @Field(() => String, { nullable: true })
  tenantId?: string | null;

  @Field(() => String, { nullable: true })
  tenantSlug?: string | null;

  @Field(() => ID)
  serviceId!: string;

  @Field(() => ID)
  specialistId!: string;

  @Field(() => String)
  clientName!: string;

  @Field(() => String, { nullable: true })
  clientContact?: string | null;

  @Field(() => String)
  startAt!: string;

  @Field(() => String)
  endAt!: string;

  @Field(() => String, { nullable: true })
  origin?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => PaymentMethodType, { nullable: true })
  paymentMethodType?: PaymentMethodType | null;

  @Field(() => Int, { nullable: true })
  advanceAmountCents?: number | null;

  @Field(() => String, { nullable: true })
  paymentReference?: string | null;

  @Field(() => String, { nullable: true })
  paymentProofUrl?: string | null;
}

@InputType()
export class RescheduleAppointmentInput {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  startAt!: string;

  @Field(() => ID, { nullable: true })
  specialistId?: string | null;
}
