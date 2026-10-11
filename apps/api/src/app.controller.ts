import { Controller, Get } from '@nestjs/common';

export interface HealthPayload {
  service: string;
  status: string;
}

const HEALTH: HealthPayload = { service: 'foundly-api', status: 'ok' };

@Controller()
export class AppController {
  @Get()
  getHealth(): HealthPayload {
    return HEALTH;
  }
}
