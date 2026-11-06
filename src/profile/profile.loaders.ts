import DataLoader from 'dataloader';
import type { ProfileRepository } from './profile.repository';

/**
 * DataLoader требует вернуть результат строго в порядке ключей.
 * Для ключа без строк возвращается пустой массив, строки внутри группы сохраняют порядок из базы.
 */
function childLoader<Row>(
  fetchRows: (parentIds: readonly string[]) => Promise<Row[]>,
  getParentId: (row: Row) => string,
) {
  return new DataLoader<string, Row[]>(async (parentIds) => {
    const rows = await fetchRows(parentIds);
    const groups = new Map<string, Row[]>();
    for (const row of rows) {
      const parentId = getParentId(row);
      groups.set(parentId, [...(groups.get(parentId) ?? []), row]);
    }
    return parentIds.map((parentId) => groups.get(parentId) ?? []);
  });
}

/** Новый набор создаётся на каждый GraphQL-запрос, поэтому кэш загрузчиков не живёт дольше запроса. */
export function createProfileLoaders(repository: ProfileRepository) {
  return {
    links: childLoader((ids) => repository.findLinks(ids), (row) => row.profileId),
    skills: childLoader((ids) => repository.findSkills(ids), (row) => row.profileId),
    experience: childLoader((ids) => repository.findExperience(ids), (row) => row.profileId),
    achievements: childLoader((ids) => repository.findAchievements(ids), (row) => row.experienceId),
    projects: childLoader((ids) => repository.findProjects(ids), (row) => row.profileId),
  };
}

export type ProfileLoaders = ReturnType<typeof createProfileLoaders>;

export interface GraphQLContext {
  loaders: ProfileLoaders;
}
