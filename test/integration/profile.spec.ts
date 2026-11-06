import request from 'supertest';
import { seed } from '../../prisma/seed';
import { createTestApp, runGraphQL, tablesOf, TestApp } from '../helpers';

const TASK_QUERY = `query { profile { name description skills { name } experience { company position } projects { name } } }`;

const FULL_QUERY = `query {
  profile {
    id name description
    links { id title url }
    skills { id name }
    experience {
      id company position
      period { from to isCurrent }
      achievements { id text }
    }
    projects { id name description url }
  }
}`;

describe('GraphQL API', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(() => {
    t.queries.length = 0;
    t.transactionCommands.length = 0;
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('запрос из задания отдаёт все поля с реальными значениями', async () => {
    const { data, errors } = await runGraphQL(t.app, TASK_QUERY);
    expect(errors).toBeUndefined();
    expect(data.profile.name).toBe('Егор Брусенцов');
    expect(data.profile.description).toContain('ОмГТУ');
    expect(data.profile.skills).toContainEqual({ name: 'TypeScript' });
    expect(data.profile.experience).toEqual([
      { company: 'Фриланс и собственные проекты', position: 'AI Full-Stack разработчик и DevOps' },
      { company: 'ГК «Сатори Консалтинг»', position: 'Бизнес-аналитик, производственная практика' },
    ]);
    expect(data.profile.projects).toContainEqual({ name: 'Цифровая визитка' });
  });

  it('полный запрос делает ровно 6 SQL-запросов, по одному на таблицу', async () => {
    const { data, errors } = await runGraphQL(t.app, FULL_QUERY);
    expect(errors).toBeUndefined();
    // Без этой проверки счётчик не гарантирует, что мест работы с достижениями было несколько.
    const withAchievements = data.profile.experience.filter((job: any) => job.achievements.length > 0);
    expect(withAchievements.length).toBeGreaterThanOrEqual(2);
    expect(tablesOf(t.queries).sort()).toEqual(
      ['Achievement', 'Experience', 'Link', 'Profile', 'Project', 'Skill'],
    );
  });

  it('{ profile { name } } делает один запрос и не трогает дочерние таблицы', async () => {
    await runGraphQL(t.app, '{ profile { name } }');
    expect(tablesOf(t.queries)).toEqual(['Profile']);
  });

  it('два алиаса на profile не увеличивают число запросов к дочерним таблицам', async () => {
    const { errors } = await runGraphQL(
      t.app,
      `{
        a: profile { skills { name } experience { achievements { text } } }
        b: profile { skills { name } experience { achievements { text } } }
      }`,
    );
    expect(errors).toBeUndefined();
    expect(tablesOf(t.queries).sort()).toEqual(['Achievement', 'Experience', 'Profile', 'Profile', 'Skill']);
  });

  it('кэш загрузчиков не переживает запрос', async () => {
    const before = await runGraphQL(t.app, '{ profile { skills { name } } }');
    await t.prisma.skill.update({ where: { id: 'skill-typescript' }, data: { name: 'Изменено' } });
    const after = await runGraphQL(t.app, '{ profile { skills { name } } }');
    await seed(t.prisma);
    expect(before.data.profile.skills).toContainEqual({ name: 'TypeScript' });
    expect(after.data.profile.skills).toContainEqual({ name: 'Изменено' });
  });

  it('порядок стабилен, текущая работа первая, период в месяцах', async () => {
    const first = await runGraphQL(t.app, FULL_QUERY);
    const second = await runGraphQL(t.app, FULL_QUERY);
    expect(second).toEqual(first);

    const { experience, skills } = first.data.profile;
    expect(skills[0].name).toBe('TypeScript');
    expect(experience.map((job: any) => job.period)).toEqual([
      { from: '2026-03', to: null, isCurrent: true },
      { from: '2026-06', to: '2026-08', isCurrent: false },
    ]);
    expect(experience[0].achievements[0].text).toContain('RAG-консультантом');
  });

  it('закрытый проект отдаёт url: null', async () => {
    const { data } = await runGraphQL(t.app, '{ profile { projects { id url } } }');
    expect(data.profile.projects).toContainEqual({ id: 'project-custom', url: null });
  });

  it('sortOrder не отдаётся в GraphQL', async () => {
    const response = await request(t.app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ profile { skills { sortOrder } } }' })
      .expect(400);
    expect(response.body.errors[0].message).toContain('Cannot query field "sortOrder"');
  });

  it('повторный сид не меняет JSON ответа API', async () => {
    const before = await runGraphQL(t.app, FULL_QUERY);
    await seed(t.prisma);
    await seed(t.prisma);
    expect(await runGraphQL(t.app, FULL_QUERY)).toEqual(before);
  });

  it('при пустой базе возвращает понятную ошибку без стека', async () => {
    await t.prisma.profile.deleteMany();
    const body = await runGraphQL(t.app, '{ profile { name } }').finally(() => seed(t.prisma));
    expect(body.data).toBeNull();
    expect(body.errors?.[0].message).toBe('Профиль не найден');
    expect(JSON.stringify(body)).not.toContain('stacktrace');
  });

  it('GET /graphql из браузера отдаёт страницу Sandbox', async () => {
    const response = await request(t.app.getHttpServer())
      .get('/graphql')
      .set('Accept', 'text/html')
      .expect(200);
    expect(response.text).toContain('embeddable-sandbox');
  });

  it('интроспекция включена', async () => {
    const { data } = await runGraphQL(t.app, '{ __type(name: "Period") { fields { name } } }');
    expect(data.__type.fields.map((field: any) => field.name)).toEqual(['from', 'to', 'isCurrent']);
  });

  it('/ делает редирект на /graphql', async () => {
    const response = await request(t.app.getHttpServer()).get('/').expect(302);
    expect(response.headers.location).toBe('/graphql');
  });
});
