import { Field, ID, ObjectType } from '@nestjs/graphql';

/** User identity resolved from a verified Supabase access token. */
export interface AuthUser {
  sub: string;
  email?: string | null;
  role: string;
  aud: string;
  exp: number;
  iat?: number;
  /** Organization membership from the `tenant_id` claim (additive; optional). */
  tenantId?: string;
  /**
   * Global platform role from the verified `app_metadata.platform_role` claim (additive; optional).
   * `'super_admin'` grants the platform console; a business account cannot self-grant it.
   */
  platformRole?: string;
}

/** GraphQL view of the authenticated identity (sample protected surface). */
@ObjectType()
export class ViewerObject {
  @Field(() => ID)
  sub!: string;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String)
  role!: string;

  @Field(() => String)
  aud!: string;
}