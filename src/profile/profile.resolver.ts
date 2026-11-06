import { Context, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { Experience as ExperienceRow } from '../generated/prisma/client';
import type { GraphQLContext } from './profile.loaders';
import { Achievement, Experience, Link, Period, Profile, Project, Skill } from './profile.models';
import { ProfileService } from './profile.service';

@Resolver(() => Profile)
export class ProfileResolver {
  constructor(private readonly service: ProfileService) {}

  @Query(() => Profile, { description: 'Профиль кандидата' })
  profile() {
    return this.service.getProfile();
  }

  @ResolveField(() => [Link])
  links(@Parent() profile: Profile, @Context() { loaders }: GraphQLContext) {
    return loaders.links.load(profile.id);
  }

  @ResolveField(() => [Skill])
  skills(@Parent() profile: Profile, @Context() { loaders }: GraphQLContext) {
    return loaders.skills.load(profile.id);
  }

  @ResolveField(() => [Experience], { description: 'Текущая работа первой, затем по убыванию дат' })
  async experience(@Parent() profile: Profile, @Context() { loaders }: GraphQLContext) {
    const rows = await loaders.experience.load(profile.id);
    return this.service.sortExperience(rows);
  }

  @ResolveField(() => [Project])
  projects(@Parent() profile: Profile, @Context() { loaders }: GraphQLContext) {
    return loaders.projects.load(profile.id);
  }
}

@Resolver(() => Experience)
export class ExperienceResolver {
  constructor(private readonly service: ProfileService) {}

  @ResolveField(() => Period)
  period(@Parent() experience: ExperienceRow) {
    return this.service.getPeriod(experience);
  }

  @ResolveField(() => [Achievement])
  achievements(@Parent() experience: ExperienceRow, @Context() { loaders }: GraphQLContext) {
    return loaders.achievements.load(experience.id);
  }
}
