import { TagIcon } from "lucide-react";

import { createDeviceType } from "@/actions/create-device-type.action";
import { getDeviceTypes } from "@/actions/get-devices.action";
import { updateDeviceType } from "@/actions/update-device-type.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const TYPE_ERRORS: Record<string, string> = {
  required: "A type name is required.",
  exists: "A device type with that name already exists.",
  save: "Could not save. Check the server logs.",
};

export interface DeviceTypesPageProps {
  searchParams: Promise<{ typeSaved?: string; typeError?: string }>;
}

export default async function DeviceTypesPage(props: DeviceTypesPageProps) {
  const { typeSaved, typeError } = await props.searchParams;
  const deviceTypes = await getDeviceTypes();

  return (
    <div className="flex w-full flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-chart-2">New Device Type</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={createDeviceType} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="device_type_name">Name</FieldLabel>
              <Input id="device_type_name" name="device_type_name" required />
            </Field>

            {typeError && <p className="text-sm text-red-600">{TYPE_ERRORS[typeError] ?? TYPE_ERRORS.save}</p>}
            {typeSaved && <p className="text-sm text-chart-2">Device type saved.</p>}

            <Button type="submit" className="w-full bg-chart-2 text-white hover:bg-chart-2/90">
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-chart-2">Device Types</CardTitle>
          <CardDescription>Disabled types can&apos;t be picked for new devices.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {deviceTypes.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TagIcon />
                </EmptyMedia>
                <EmptyTitle>No device types yet</EmptyTitle>
                <EmptyDescription>Device types you create will show up here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader className="bg-chart-2 [&_th]:font-bold [&_th]:text-white!">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:nth-child(even)]:bg-muted/60">
                  {deviceTypes.map((t) => (
                    <TableRow key={t.device_type_id} className={t.is_active ? undefined : "text-muted-foreground"}>
                      <TableCell>
                        <form action={updateDeviceType} className="flex flex-row items-center gap-2">
                          <input type="hidden" name="device_type_id" value={t.device_type_id} />
                          {/* Reads as plain cell text until hovered/focused; -ml-2.5 lines the text up with the column header. */}
                          <Input
                            name="device_type_name"
                            defaultValue={t.device_type_name}
                            aria-label="Device type name"
                            className="-ml-2.5 border-transparent text-sm hover:border-input md:text-sm"
                            required
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>{t.is_active ? "Active" : "Disabled"}</TableCell>
                      <TableCell className="text-right">
                        <form action={updateDeviceType}>
                          <input type="hidden" name="device_type_id" value={t.device_type_id} />
                          <input type="hidden" name="is_active" value={String(!t.is_active)} />
                          <Button type="submit" size="sm" variant={t.is_active ? "destructive" : "outline"}>
                            {t.is_active ? "Disable" : "Enable"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
