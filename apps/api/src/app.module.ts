import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { HealthResolver } from './health/health.resolver';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src', 'schema.gql'),
      playground: !isProduction,
      introspection: !isProduction,
    }),
  ],
  controllers: [AppController],
  providers: [HealthResolver],
})
export class AppModule {}
