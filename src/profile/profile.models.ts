import { Field, ID, ObjectType } from '@nestjs/graphql';

// Вложенные списки объявлены через @ResolveField в profile.resolver.ts, поэтому здесь только свои поля типа.

@ObjectType()
export class Profile {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;
}

@ObjectType()
export class Link {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  url!: string;
}

@ObjectType()
export class Skill {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}

@ObjectType({ description: 'Период работы с точностью до месяца' })
export class Period {
  @Field({ description: 'Начало в формате YYYY-MM' })
  from!: string;

  @Field(() => String, { nullable: true, description: 'Конец в формате YYYY-MM, null для текущей работы' })
  to!: string | null;

  @Field()
  isCurrent!: boolean;
}

@ObjectType()
export class Experience {
  @Field(() => ID)
  id!: string;

  @Field()
  company!: string;

  @Field({ description: 'Должность' })
  position!: string;
}

@ObjectType()
export class Achievement {
  @Field(() => ID)
  id!: string;

  @Field()
  text!: string;
}

@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на проект, null для закрытого кода' })
  url!: string | null;
}
