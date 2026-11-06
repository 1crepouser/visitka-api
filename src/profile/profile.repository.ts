import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Единственная точка доступа к базе. Методы списков принимают массив id, чтобы DataLoader мог собрать их в один запрос. */
@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProfile() {
    return this.prisma.profile.findFirst({ orderBy: { id: 'asc' } });
  }

  findLinks(profileIds: readonly string[]) {
    return this.prisma.link.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findSkills(profileIds: readonly string[]) {
    return this.prisma.skill.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  // Порядок опыта задаёт ProfileService.
  findExperience(profileIds: readonly string[]) {
    return this.prisma.experience.findMany({
      where: { profileId: { in: [...profileIds] } },
    });
  }

  findAchievements(experienceIds: readonly string[]) {
    return this.prisma.achievement.findMany({
      where: { experienceId: { in: [...experienceIds] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findProjects(profileIds: readonly string[]) {
    return this.prisma.project.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }
}
