import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { createProfileLoaders } from './profile/profile.loaders';
import { ProfileModule } from './profile/profile.module';
import { ProfileRepository } from './profile/profile.repository';

const EXAMPLE_QUERY = `query Visitka {
  profile {
    name
    description
    links { title url }
    skills { name }
    experience {
      company
      position
      period { from to isCurrent }
      achievements { text }
    }
    projects { name description url }
  }
}
`;

@Module({
  imports: [
    PrismaModule,
    ProfileModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ProfileModule],
      inject: [ProfileRepository],
      useFactory: (repository: ProfileRepository) => ({
        autoSchemaFile: true,
        // Визитка публичная: Sandbox и интроспекция нужны и в production, где Apollo выключает их по умолчанию.
        playground: false,
        introspection: true,
        includeStacktraceInErrorResponses: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true, document: EXAMPLE_QUERY })],
        context: () => ({ loaders: createProfileLoaders(repository) }),
      }),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
