import { Injectable, NotFoundException } from '@nestjs/common';
import type { Experience } from '../generated/prisma/client';
import { Period } from './profile.models';
import { ProfileRepository } from './profile.repository';

/** Первое число месяца (UTC) в базе превращается в строку YYYY-MM. */
function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

@Injectable()
export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  /** Сид заполняет базу при каждом запуске, поэтому пустая база считается ошибкой, а не обычным ответом. */
  async getProfile() {
    const profile = await this.repository.findProfile();
    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }
    return profile;
  }

  getPeriod(experience: Pick<Experience, 'startDate' | 'endDate'>): Period {
    return {
      from: toMonth(experience.startDate),
      to: experience.endDate ? toMonth(experience.endDate) : null,
      isCurrent: experience.endDate === null,
    };
  }

  /** Текущая работа первой, затем по убыванию даты окончания и даты начала. */
  sortExperience<T extends Pick<Experience, 'id' | 'startDate' | 'endDate'>>(experience: T[]): T[] {
    const endTime = (item: T) => item.endDate?.getTime() ?? Number.POSITIVE_INFINITY;
    return [...experience].sort(
      (a, b) =>
        endTime(b) - endTime(a) ||
        b.startDate.getTime() - a.startDate.getTime() ||
        a.id.localeCompare(b.id),
    );
  }
}
