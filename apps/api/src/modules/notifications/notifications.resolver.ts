import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser as AuthUserDecorator, RequireAuth } from '../auth/jwt.decorators';
import type { AuthUser } from '../auth/jwt.types';
import { NotificationsService } from './notifications.service';
import { NotificationObject } from './notifications.types';

@Resolver(() => NotificationObject)
export class NotificationsResolver {
  constructor(private readonly service: NotificationsService) {}

  /** Authenticated: the caller business's notifications, newest first. */
  @Query(() => [NotificationObject])
  @RequireAuth()
  notifications(
    @AuthUserDecorator() user: AuthUser,
    @Args('read', { type: () => Boolean, nullable: true }) read?: boolean | null,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number | null,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number | null,
  ): Promise<NotificationObject[]> {
    return this.service.list(user, { read, limit, offset });
  }

  /** Authenticated: number of unread notifications for the caller business. */
  @Query(() => Int)
  @RequireAuth()
  unreadNotificationCount(@AuthUserDecorator() user: AuthUser): Promise<number> {
    return this.service.countUnread(user);
  }

  /** Authenticated: mark one notification as read (idempotent). */
  @Mutation(() => NotificationObject)
  @RequireAuth()
  markNotificationRead(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<NotificationObject> {
    return this.service.markRead(user, id);
  }

  /** Authenticated: mark all notifications as read; returns the count updated. */
  @Mutation(() => Int)
  @RequireAuth()
  markAllNotificationsRead(@AuthUserDecorator() user: AuthUser): Promise<number> {
    return this.service.markAllRead(user);
  }

  /** Authenticated: permanently delete one notification. */
  @Mutation(() => Boolean)
  @RequireAuth()
  deleteNotification(
    @AuthUserDecorator() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.delete(user, id);
  }
}
