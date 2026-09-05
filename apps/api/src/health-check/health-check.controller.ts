import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('health-check')
export class HealthCheckController {
  @Get()
  @HttpCode(HttpStatus.OK)
  public getHealthCheck() {}
}
