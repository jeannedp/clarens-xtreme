import { TagIcon } from "lucide-react";

import { createDevice } from "@/actions/create-device.action";
import { getDevices, getDeviceTypes } from "@/actions/get-devices.action";
import { setDeviceActive } from "@/actions/set-device-active.action";
import { updateDevice } from "@/actions/update-device.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  required: "All fields are required.",
  exists: "A device with that ID already exists.",
  save: "Could not save. Check the server logs.",
};

const NAME_ERRORS: Record<string, string> = {
  required: "A device name is required.",
  save: "Could not save. Check the server logs.",
};

export interface DevicesPageProps {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    nameSaved?: string;
    nameError?: string;
  }>;
}

export default async function DevicesPage(props: DevicesPageProps) {
  const { saved, error, nameSaved, nameError } = await props.searchParams;
  const [devices, deviceTypes] = await Promise.all([getDevices(), getDeviceTypes()]);

  const typeItems = deviceTypes
    .filter((t) => t.is_active)
    .map((t) => ({ value: t.device_type_id, label: t.device_type_name }));

  return (
    <div className="flex w-full flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-chart-2">New Device</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={createDevice} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="device_id">Device ID</FieldLabel>
                <Input id="device_id" name="device_id" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="device_name">Name</FieldLabel>
                <Input id="device_name" name="device_name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="device_type_id">Type</FieldLabel>
                <Select name="device_type_id" items={typeItems} required>
                  <SelectTrigger id="device_type_id" className="w-full bg-white hover:bg-white">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {typeItems.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {error && <p className="text-sm text-red-600">{ERRORS[error] ?? ERRORS.save}</p>}
            {saved && <p className="text-sm text-chart-2">Device created.</p>}

            <Button type="submit" className="w-full bg-chart-2 text-white hover:bg-chart-2/90">
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-chart-2">Devices</CardTitle>
          <CardDescription>Disabled devices are kept for history but marked inactive.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {nameError && <p className="text-sm text-red-600">{NAME_ERRORS[nameError] ?? NAME_ERRORS.save}</p>}
          {nameSaved && <p className="text-sm text-chart-2">Device name saved.</p>}

          {devices.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TagIcon />
                </EmptyMedia>
                <EmptyTitle>No devices yet</EmptyTitle>
                <EmptyDescription>Devices you create will show up here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader className="bg-chart-2 [&_th]:font-bold [&_th]:text-white!">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:nth-child(even)]:bg-muted/60">
                  {devices.map((d) => (
                    <TableRow key={d.device_id} className={d.is_active ? undefined : "text-muted-foreground"}>
                      <TableCell>{d.device_id}</TableCell>
                      <TableCell>
                        <form action={updateDevice} className="flex flex-row items-center gap-2">
                          <input type="hidden" name="device_id" value={d.device_id} />
                          {/* Reads as plain cell text until hovered/focused; -ml-2.5 lines the text up with the column header. */}
                          <Input
                            name="device_name"
                            defaultValue={d.device_name}
                            aria-label="Device name"
                            className="-ml-2.5 border-transparent text-sm hover:border-input md:text-sm"
                            required
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>{d.device_type_name}</TableCell>
                      <TableCell>{d.is_active ? "Active" : "Disabled"}</TableCell>
                      <TableCell className="text-right">
                        <form action={setDeviceActive}>
                          <input type="hidden" name="device_id" value={d.device_id} />
                          <input type="hidden" name="is_active" value={String(!d.is_active)} />
                          <Button type="submit" size="sm" variant={d.is_active ? "destructive" : "outline"}>
                            {d.is_active ? "Disable" : "Enable"}
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
