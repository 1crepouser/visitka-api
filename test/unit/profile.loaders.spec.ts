import { createProfileLoaders } from '../../src/profile/profile.loaders';
import { ProfileRepository } from '../../src/profile/profile.repository';

describe('createProfileLoaders', () => {
  const rows = [
    { id: 'skill-1', name: 'B1', profileId: 'b' },
    { id: 'skill-2', name: 'A1', profileId: 'a' },
    { id: 'skill-3', name: 'B2', profileId: 'b' },
  ];

  function setup() {
    const findSkills = jest.fn(async () => rows);
    const loaders = createProfileLoaders({ findSkills } as unknown as ProfileRepository);
    return { findSkills, loaders };
  }

  it('возвращает строки в порядке ключей, а не в порядке из базы', async () => {
    const { loaders } = setup();
    const [a, b] = await loaders.skills.loadMany(['a', 'b']);
    expect(a).toEqual([rows[1]]);
    expect(b).toEqual([rows[0], rows[2]]);
  });

  it('возвращает [] для ключа без строк', async () => {
    const { loaders } = setup();
    await expect(loaders.skills.load('no-rows')).resolves.toEqual([]);
  });

  it('собирает ключи одного тика в один вызов репозитория', async () => {
    const { findSkills, loaders } = setup();
    await Promise.all([loaders.skills.load('a'), loaders.skills.load('b'), loaders.skills.load('a')]);
    expect(findSkills).toHaveBeenCalledTimes(1);
    expect(findSkills).toHaveBeenCalledWith(['a', 'b']);
  });
});
