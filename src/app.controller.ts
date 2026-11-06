import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  /** Проверяющий открывает адрес сервиса и сразу попадает в Apollo Sandbox, а не на 404. */
  @Get()
  @Redirect('/graphql', 302)
  root() {}
}
