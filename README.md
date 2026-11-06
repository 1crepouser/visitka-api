# visitka-api

Цифровая визитка: backend на NestJS, Prisma и GraphQL с Apollo Sandbox. Отдаёт профиль кандидата, навыки, опыт работы и проекты.

**Рабочий проект и Apollo Sandbox:** <https://visitka-api.onrender.com/graphql>

Первое открытие после простоя занимает до минуты, подробности в разделе «Ограничения».

## Запуск с нуля

Нужен только Docker. Файл `.env` не требуется.

```bash
docker compose up --build
```

Адрес Sandbox: <http://localhost:3000/graphql>. Адрес `/` перенаправляет туда же. Порт меняется переменной `PORT`.

При старте контейнер сам применяет миграции и заполняет базу. Заново с пустой базой: `docker compose down -v`, затем та же команда.

## Тесты

Типы, линтер и все тесты на Node 24 и настоящем PostgreSQL 16:

```bash
docker compose --profile test run --rm --build test
docker compose --profile test down -v
```

Быстрый цикл с хоста, после `npm ci` и `npx prisma generate`:

```bash
docker compose --profile test up -d --wait test-db
export DATABASE_URL=postgresql://visitka:local-dev-only@127.0.0.1:55432/visitka_test
npm test
```

## Пример запроса

```graphql
query {
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
```

## Схема

```graphql
type Profile {
  id: ID!
  name: String!
  description: String!
  links: [Link!]!
  skills: [Skill!]!

  """Текущая работа первой, затем по убыванию дат"""
  experience: [Experience!]!
  projects: [Project!]!
}

type Link {
  id: ID!
  title: String!
  url: String!
}

type Skill {
  id: ID!
  name: String!
}

"""Период работы с точностью до месяца"""
type Period {
  """Начало в формате YYYY-MM"""
  from: String!

  """Конец в формате YYYY-MM, null для текущей работы"""
  to: String
  isCurrent: Boolean!
}

type Experience {
  id: ID!
  company: String!

  """Должность"""
  position: String!
  period: Period!
  achievements: [Achievement!]!
}

type Achievement {
  id: ID!
  text: String!
}

type Project {
  id: ID!
  name: String!
  description: String!

  """Ссылка на проект, null для закрытого кода"""
  url: String
}

type Query {
  """Профиль кандидата"""
  profile: Profile!
}
```

## Структура

```
src/main.ts                        запуск, 0.0.0.0 и PORT, shutdown hooks
src/app.module.ts                  настройка GraphQL и Sandbox, загрузчики в контексте
src/app.controller.ts              редирект с / на /graphql
src/prisma/                        PrismaService, глобальный модуль
src/profile/profile.models.ts      типы GraphQL
src/profile/profile.resolver.ts    какие поля есть и откуда их взять
src/profile/profile.service.ts     период, порядок опыта, ошибка при пустой базе
src/profile/profile.loaders.ts     группировка вложенных данных одним запросом
src/profile/profile.repository.ts  единственная точка доступа к базе
prisma/                            схема, миграции, данные и сид
test/                              модульные и интеграционные тесты
scripts/check-repo.sh              поиск секретов и личных данных в истории Git
```

## Решения и отклонённые варианты

| Решение | Почему | Что отклонено |
| --- | --- | --- |
| Слои резолвер, сервис, репозиторий | Резолвер описывает API, сервис содержит правила, репозиторий знает про базу. Период и порядок опыта проверяются модульно без базы | Prisma прямо в резолвере: логику нельзя проверить отдельно |
| Отдельный репозиторий | Все запросы видны в одном файле, в том числе их порядок и фильтры | Вызовы Prisma из сервиса и загрузчиков: запросы расходятся по коду |
| DataLoader на каждый запрос в контексте GraphQL | Кэш живёт один запрос, дерево провайдеров остаётся синглтонами | Синглтон смешал бы кэш разных запросов. `Scope.REQUEST` пересоздавал бы дерево провайдеров на каждый запрос. `include` загружал бы дочерние таблицы, даже когда их не запросили |
| Code-first | Типы GraphQL и TypeScript живут в одном месте, SDL не расходится с кодом | Schema-first: отдельный файл схемы и ручная синхронизация с классами |
| Отдельная таблица достижений | Порядок и `id` у каждой строки, загрузка отдельным запросом только по требованию | Массив строк в опыте: достижения всегда читались бы вместе с опытом |
| Месяц вместо даты | В исходных данных есть только месяцы, а точный день был бы выдумкой. В базе первое число месяца, в API `YYYY-MM` | Отдавать полную дату: ложная точность |
| `null` для текущей работы и закрытого кода | Отсутствие значения не требует условных строк вроде «по настоящее время». `isCurrent` избавляет клиент от проверки | Пустая строка или флаг в базе: два способа записать одно и то же |
| Постоянные id и идемпотентный сид | Повторный запуск даёт тот же JSON. Удаление и создание идут в одной транзакции | Upsert каждой строки: сложнее, а удалённые из файла строки остались бы в базе |
| Автоинициализация в `docker-entrypoint.sh` | Запуск с нуля не требует ручных шагов. `exec` передаёт сигналы остановки приложению | Отдельный сервис миграций: лишний шаг ради одного контейнера |
| Нет мутаций и авторизации | API только читает публичные данные визитки, защищать нечего, менять данные должен сид из Git | Авторизация и панель правки: код без задачи |
| Схема без циклов | У вложенных типов нет ссылки обратно на профиль, поэтому глубина запроса ограничена самой схемой | Лимит глубины: защита от проблемы, которой здесь нет |
| `Profile!` и ошибка при пустой базе | Сид заполняет базу при каждом запуске, поэтому пустая база означает поломку. Клиент получает сообщение `Профиль не найден` | Nullable-поле: поломка выглядела бы как обычный ответ |
| Без `helmet` | API не отдаёт своего содержимого, кроме Sandbox, а CSP пришлось бы настраивать под CDN Apollo | `helmet` с настройками: код без пользы для этого API |

`sortOrder` хранится в базе, но не отдаётся в GraphQL: клиенту нужен готовый порядок. Колонка не называется `position`, потому что `Experience.position` означает должность.

## Версии

Проверены через `npm view` 06.11.2026.

- **Prisma 7.10.1.** Собирается с CommonJS-сборкой NestJS без обходных решений: генератор `prisma-client` с `moduleFormat = "cjs"`, адаптер `@prisma/adapter-pg`, проверено сборкой, тестами и запуском из образа. Версия закреплена точно, потому что тег `latest` у пакета `prisma` указывает на `8.0.0-rc.30`, а у `@prisma/client` на `7.10.1`.
- **NestJS 11, `@nestjs/graphql` 13.** Актуальный NestJS 12 опубликован как ESM (`"type": "module"`). Ветка 11 оставляет простую CommonJS-сборку и обычный запуск Jest через `ts-jest`.
- **TypeScript 5.9.** `ts-jest` требует версию ниже 7, `typescript-eslint` ниже 6.1.
- **graphql 16.** `@apollo/server` 5 требует `^16.11.0`.
- **Node 24 в образе.** Подходит под требования Prisma 7 (`^20.19 || ^22.12 || >=24.0`) и NestJS 11.
- **`overrides` в `package.json`.** `npm audit --omit=dev` показывал 5 уязвимостей уровня high через `multer` и `@graphql-tools/utils` в ветке NestJS 11. Обе зависимости подняты в пределах своей мажорной версии, после этого аудит production-зависимостей чист, а тесты проходят. В зависимостях для разработки остаются уведомления аудита, в образ они не попадают.

## Как проверяется отсутствие N+1

Тест подписывается на событие `query` клиента Prisma и считает настоящие SQL-запросы. `BEGIN` и `COMMIT` учитываются отдельно.

| Запрос | С DataLoader | Без DataLoader для достижений |
| --- | --- | --- |
| Полный запрос с достижениями | 6: `Profile`, `Link`, `Skill`, `Experience`, `Achievement`, `Project` | 7, тест падает |
| Два алиаса на `profile` с достижениями | 5: `Profile` дважды, `Skill`, `Experience`, `Achievement` | 8, тест падает |
| `{ profile { name } }` | 1: только `Profile` | не меняется |

Столбец «без DataLoader» получен реальным прогоном: `loaders.achievements.load` был временно заменён прямым вызовом репозитория. Упали 2 теста из 21, после возврата кода прошли все 21.

## Как добавить новое поле

Пример: `city` у профиля. Этот сценарий проверен в отдельной копии репозитория.

1. Добавить поле в `prisma/schema.prisma`, затем создать миграцию и клиент. В Prisma 7 `migrate dev` не запускает генерацию сам:
   ```bash
   docker compose --profile test up -d --wait test-db
   export DATABASE_URL=postgresql://visitka:local-dev-only@127.0.0.1:55432/visitka_test
   npx prisma migrate dev --name add_profile_city
   npx prisma generate
   ```
2. Добавить `@Field()` в класс `Profile` в `src/profile/profile.models.ts`.
3. Добавить значение в `prisma/seed-data.ts`.
4. Дописать проверку в `test/integration/profile.spec.ts` и запустить `npm test`.

Новая вложенная таблица требует ещё метода в репозитории, загрузчика в `profile.loaders.ts` и `@ResolveField` в резолвере.

## Ограничения

- Sandbox загружает свой код с CDN Apollo, поэтому без доступа к CDN страница не откроется. Сам API через `POST /graphql` от этого не зависит.
- Образ занимает около 890 МБ: CLI `prisma` нужен в production для `migrate deploy` и тянет свои зависимости.
- Сид удаляет и создаёт профиль при каждом запуске. Это рассчитано на один экземпляр приложения.
- Опубликованная версия работает на бесплатном тарифе Render. Сервис засыпает после 15 минут без запросов. Замер 06.11.2026: первый запрос после простоя занял 44 секунды, следующий 0,6 секунды.
- Бесплатная база Render живёт 30 дней после создания. Данные хранятся в `prisma/seed-data.ts`, поэтому новая база заполнится при следующем запуске сервиса, достаточно заменить `DATABASE_URL`.
