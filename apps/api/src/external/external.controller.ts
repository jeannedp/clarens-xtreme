import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from 'src/shared/guards/basic-auth.guard';
import { ExternalService } from './external.service';
import { CurrentDevice } from 'src/shared/decorators/current-device.decorator';
import type { DeviceContext } from 'src/shared/models/device-context.model';

@Controller('external')
export class ExternalController {
  constructor(
    private readonly externalService: ExternalService,
  ){}

  @Post("reads")
  @UseGuards(BasicAuthGuard)
  public async logEvent(
    @Query() rfid: string,
    @Query() rssi: string,
    @Query() datestamp: string,
    @Query() id: string,
    
    @CurrentDevice() currentDevice: DeviceContext,
  ) {
    // Compare against heartbeat
    return currentDevice;
  }
}
