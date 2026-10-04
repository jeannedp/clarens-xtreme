import { RadioTowerIcon } from "lucide-react";

import { createReader } from "@/actions/create-reader.action";
import { getReaders } from "@/actions/get-readers.action";
import { setReaderActive } from "@/actions/set-reader-active.action";
import { updateReader } from "@/actions/update-reader.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  required: "All fields are required.",
  exists: "A reader with that ID already exists.",
  save: "Could not save. Check the server logs.",
};

const NAME_ERRORS: Record<string, string> = {
  required: "A reader name is required.",
  save: "Could not save. Check the server logs.",
};

export interface ReadersPageProps {
  searchParams: Promise<{ saved?: string; error?: string; nameSaved?: string; nameError?: string }>;
}

export default async function ReadersPage(props: ReadersPageProps) {
  const { saved, error, nameSaved, nameError } = await props.searchParams;
  const readers = await getReaders();

  return (
    <div className="flex w-full max-w-[800px] flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-chart-2">New Reader</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={createReader} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="reader_id">Reader ID</FieldLabel>
                <Input id="reader_id" name="reader_id" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="reader_name">Name</FieldLabel>
                <Input id="reader_name" name="reader_name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="heartbeat_epc">Heartbeat EPC</FieldLabel>
                <Input id="heartbeat_epc" name="heartbeat_epc" required />
              </Field>
            </div>

            {error && <p className="text-sm text-red-600">{ERRORS[error] ?? ERRORS.save}</p>}
            {saved && <p className="text-sm text-chart-2">Reader created.</p>}

            <Button type="submit" className="w-full bg-chart-2 text-white hover:bg-chart-2/90">
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-chart-2">Readers</CardTitle>
          <CardDescription>Disabled readers are kept for history but marked inactive.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {nameError && <p className="text-sm text-red-600">{NAME_ERRORS[nameError] ?? NAME_ERRORS.save}</p>}
          {nameSaved && <p className="text-sm text-chart-2">Reader name saved.</p>}

          {readers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RadioTowerIcon />
                </EmptyMedia>
                <EmptyTitle>No readers yet</EmptyTitle>
                <EmptyDescription>Readers you create will show up here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader className="bg-chart-2 [&_th]:font-bold [&_th]:text-white!">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Heartbeat EPC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:nth-child(even)]:bg-muted/60">
                  {readers.map((r) => (
                    <TableRow key={r.readerId} className={r.isActive ? undefined : "text-muted-foreground"}>
                      <TableCell>{r.readerId}</TableCell>
                      <TableCell>
                        <form action={updateReader} className="flex flex-row items-center gap-2">
                          <input type="hidden" name="reader_id" value={r.readerId} />
                          {/* Reads as plain cell text until hovered/focused; -ml-2.5 lines the text up with the column header. */}
                          <Input
                            name="reader_name"
                            defaultValue={r.readerName}
                            aria-label="Reader name"
                            className="-ml-2.5 border-transparent text-sm hover:border-input md:text-sm"
                            required
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>{r.heartbeatEpc}</TableCell>
                      <TableCell>{r.isActive ? "Active" : "Disabled"}</TableCell>
                      <TableCell className="text-right">
                        <form action={setReaderActive}>
                          <input type="hidden" name="reader_id" value={r.readerId} />
                          <input type="hidden" name="is_active" value={String(!r.isActive)} />
                          <Button type="submit" size="sm" variant={r.isActive ? "destructive" : "outline"}>
                            {r.isActive ? "Disable" : "Enable"}
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
