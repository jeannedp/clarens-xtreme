type Action = 'view' | 'create' | 'update' | 'delete';
type Resource = 'devices' | 'device_logs' | 'readers' | 'users';

export type Permission = `${Action}:${Resource}`;
