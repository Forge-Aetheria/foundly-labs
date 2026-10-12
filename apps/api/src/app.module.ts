import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { HealthResolver } from './health/health.resolver';
import { createContext } from './graphql/context';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ServicesModule } from './modules/services/services.module';
import { SpecialistsModule } from './modules/specialists/specialists.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { SharedPrismaModule } from './shared/prisma/prisma.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src', 'schema.gql'),
      playground: !isProduction,
      introspection: !isProduction,
      context: createContext,
    }),
    SharedPrismaModule,
    TenantsModule,
    ServicesModule,
    SpecialistsModule,
    AvailabilityModule,
    AppointmentsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [HealthResolver],
})
export class AppModule {}
