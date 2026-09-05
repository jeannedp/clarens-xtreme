import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Device } from "src/models/tables/device.table";
import { DeviceContext } from "../models/device-context.model";

export const CurrentDevice = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ device: Device }>();
    const authDevice = request.device;
    
    return {
      deviceId: authDevice.device_id,
      heartbeatId: authDevice.heartbeat_id,
    } as DeviceContext;
  }
);
