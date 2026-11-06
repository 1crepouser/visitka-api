export const PROFILE_ID = 'egor-brusentsov';

export const profile = {
  id: PROFILE_ID,
  name: 'Егор Брусенцов',
  description:
    'Разработчик на старте карьеры (AI Full-Stack, DevOps), студент 3 курса ОмГТУ и DevOps-трека Школы 21. ' +
    'Пишу с AI-ассистентами, а результат проверяю тестами.',
};

export const links = [
  { id: 'link-github', title: 'GitHub', url: 'https://github.com/1crepouser' },
  { id: 'link-gitlab', title: 'GitLab', url: 'https://gitlab.com/gorynych1' },
  { id: 'link-telegram', title: 'Telegram', url: 'https://t.me/egord3r' },
];

export const skills = [
  'TypeScript',
  'Python',
  'Go',
  'SQL',
  'Bash',
  'Next.js',
  'React',
  'Prisma',
  'PostgreSQL',
  'Redis',
  'Docker',
  'Docker Compose',
  'Linux',
  'Ansible',
  'nginx',
  'Caddy',
  'Prometheus',
  'Grafana',
  'GitHub Actions',
  'Vitest',
  'Playwright',
  'RAG',
].map((name) => ({ id: `skill-${name.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`, name }));

// В резюме указаны только месяцы, поэтому дата всегда первое число месяца.
export const experience = [
  {
    id: 'exp-freelance',
    company: 'Фриланс и собственные проекты',
    position: 'AI Full-Stack разработчик и DevOps',
    startDate: new Date('2026-03-01'),
    endDate: null,
    achievements: [
      'В одиночку собрал заказной веб-сервис с RAG-консультантом на GigaChat: от модели данных до Docker-развёртывания и автотестов.',
      'Написал к нему 300+ юнит- и интеграционных тестов и 87 браузерных.',
      'Автоматизировал развёртывание защищённого Airflow-стека семью ролями Ansible: TLS, LDAP, мониторинг, бэкапы.',
      'Развернул на VPS изолированные контейнеры с AI-ассистентом для двух пользователей: лимиты ресурсов, закрытый доступ, watchdog, бэкапы.',
    ],
  },
  {
    id: 'exp-satori',
    company: 'ГК «Сатори Консалтинг»',
    position: 'Бизнес-аналитик, производственная практика',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-08-01'),
    achievements: [
      'Проанализировал бизнес-процессы сети кофеен: закупки, обжарка, склад, продажи на точках.',
      'Сравнил ПО для автоматизации точек продаж и подготовил коммерческое предложение на единую информационную систему.',
      'Написал постановку задачи на разработку ИС: восемь ролей пользователей и функционал для каждой.',
    ],
  },
];

export const projects = [
  {
    id: 'project-visitka',
    name: 'Цифровая визитка',
    description: 'Этот проект: NestJS, Prisma, GraphQL, Docker.',
    url: 'https://github.com/1crepouser/visitka-api',
  },
  {
    id: 'project-airflow',
    name: 'Защищённый Airflow-стек на Ansible',
    description: 'Семь ролей Ansible: Airflow, PostgreSQL, OpenLDAP, Prometheus, Grafana, TLS, бэкапы.',
    url: 'https://gitlab.com/gorynych1/mvideotestairflow',
  },
  {
    id: 'project-custom',
    name: 'Заказной веб-сервис с RAG-консультантом',
    description: 'Заказчик: компания в сфере юридических услуг. Next.js, PostgreSQL, Prisma, pgvector, GigaChat. Код закрыт.',
    url: null,
  },
];
