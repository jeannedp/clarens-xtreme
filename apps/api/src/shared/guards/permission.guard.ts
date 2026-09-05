import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "../decorators/permission.decorator";
import { Permission } from "../models/permissions.model";
import { UserContext } from "../models/user-context.model";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ){}
  
  public async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSION_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ]
    )

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: UserContext }>();
    const user = request.user;

    console.log(user)

    if (!user || !user.permissions) {
      throw new ForbiddenException();
    }

    return true;
  }
}
