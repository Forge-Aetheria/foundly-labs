# Contract: GraphQL Operations

**Feature**: `specs/mobile/001-tenant-mobile-app` | **Date**: 2026-10-24

## Transport

- Endpoint: `EXPO_PUBLIC_API_URL` + `/graphql`.
- One POST per operation through `graphql-request`, with a hard timeout (10 s default).
- Operations live in `src/modules/<module>/*.graphql` and compile to `src/shared/api/generated.ts`.
- UI never calls the transport directly; module `services.ts` is the only entry point and module `hooks.ts` is the only UI entry point.

## Existing operations consumed

```graphql
query Me {
  me {
    userId
    role
    tenant {
      id
      status
      plan
    }
  }
}

query MyAppointments($from: String!, $to: String!) {
  myAppointments(from: $from, to: $to) {
    id
    startAt
    endAt
    status
    clientName
    notes
    service {
      id
      name
    }
    specialist {
      id
      name
    }
  }
}

query Notifications($limit: Int, $offset: Int, $read: Boolean) {
  notifications(limit: $limit, offset: $offset, read: $read) {
    id
    type
    title
    message
    read
    createdAt
  }
}

mutation MarkNotificationRead($id: ID!) {
  markNotificationRead(id: $id) {
    id
    read
  }
}

mutation UpdateMyBusinessProfile($input: UpdateBusinessProfileInput!) {
  updateMyBusinessProfile(input: $input) {
    id
    isPublic
  }
}
```

## API additions required (delivered in the API workstream)

```graphql
type PushTokenObject {
  id: ID!
  platform: PushPlatform!
  createdAt: String!
  updatedAt: String!
}

enum PushPlatform {
  IOS
  ANDROID
}

input RegisterPushTokenInput {
  token: String!
  platform: PushPlatform!
  deviceId: String
}

extend type Query {
  myBusiness: TenantObject!
}

extend type Mutation {
  registerPushToken(input: RegisterPushTokenInput!): PushTokenObject!
  unregisterPushToken(token: String!): Boolean!
}
```

`myBusiness` MUST derive the tenant from the verified JWT and return `TenantObject` including `profile`, `services` and `isPublic`.

## Error mapping

| GraphQL `extensions.code` | Mobile handling                                   |
| ------------------------- | ------------------------------------------------- |
| `UNAUTHENTICATED`         | Clear session, redirect to login                  |
| `FORBIDDEN`               | Module-level error screen with back action        |
| `VALIDATION_ERROR`        | Inline field/action error                         |
| `NOT_FOUND`               | "No encontrado" state and refresh                 |
| `CONFLICT`                | Informational error, refresh affected data        |
| Network/timeout           | "Sin conexión" state with retry, keep cached data |
| Unknown                   | Generic `STATE_ERROR` with retry                  |

## Query keys

`['me', tenantId]`, `['business', tenantId]`, `['agenda', tenantId, from, to]`, `['notifications', tenantId, filter]`. All keys include `tenantId`; the cache is cleared on logout or tenant change.
