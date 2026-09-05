import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { Device } from "src/models/tables/device.table";
import { SUPABASE_CLIENT } from "../providers/supabase-client.provider";

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient
  ){}
  
  public async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    
    const token = authorization?.split('Basic ')[1];
    if (!token) {
      throw new UnauthorizedException();
    }

    const [username, password] = Buffer.from(token, 'base64').toString().split(':');
    console.log({ username, password })
    const { data: devices, error } = await this.supabase
      .from('devices')
      .select<keyof Device, Device>('device_id')
      .eq('device_id', username);

    const currentDevice = devices?.at(0);
    // if (error || !currentDevice|| currentDevice.password !== password) {
    //   throw new UnauthorizedException();
    // }

    (request as any).device = currentDevice;
    return true;
  }
}
