import { ProfileRepository } from '../../src/profile/profile.repository';
import { ProfileService } from '../../src/profile/profile.service';

describe('ProfileService', () => {
  const service = new ProfileService({} as ProfileRepository);

  describe('getPeriod', () => {
    it('отдаёт месяц начала и конца завершённой работы', () => {
      const period = service.getPeriod({
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-01'),
      });
      expect(period).toEqual({ from: '2026-06', to: '2026-08', isCurrent: false });
    });

    it('считает работу без даты окончания текущей', () => {
      const period = service.getPeriod({ startDate: new Date('2026-03-01'), endDate: null });
      expect(period).toEqual({ from: '2026-03', to: null, isCurrent: true });
    });
  });

  describe('sortExperience', () => {
    const job = (id: string, start: string, end: string | null) => ({
      id,
      startDate: new Date(start),
      endDate: end ? new Date(end) : null,
    });

    it('ставит текущую работу первой, остальное по убыванию дат', () => {
      const sorted = service.sortExperience([
        job('old', '2024-01-01', '2024-06-01'),
        job('newer-end', '2025-01-01', '2026-01-01'),
        job('current', '2023-01-01', null),
        job('same-end-later-start', '2025-06-01', '2026-01-01'),
      ]);
      expect(sorted.map(({ id }) => id)).toEqual(['current', 'same-end-later-start', 'newer-end', 'old']);
    });

    it('не меняет исходный массив', () => {
      const source = [job('a', '2024-01-01', '2024-02-01'), job('b', '2025-01-01', null)];
      service.sortExperience(source);
      expect(source.map(({ id }) => id)).toEqual(['a', 'b']);
    });
  });

  describe('getProfile', () => {
    it('сообщает об ошибке, если база пуста', async () => {
      const empty = new ProfileService({ findProfile: async () => null } as unknown as ProfileRepository);
      await expect(empty.getProfile()).rejects.toThrow('Профиль не найден');
    });
  });
});
