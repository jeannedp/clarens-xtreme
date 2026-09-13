import { SlidersHorizontalIcon } from "lucide-react";

import { getSettings } from "@/actions/get-settings.action";
import { updateSettings } from "@/actions/update-settings.action";
import { SettingsTypeSelect } from "@/components/settings/settings-type-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export interface SettingsPageProps {
  searchParams: Promise<{ type?: string; saved?: string; error?: string }>;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const { type, saved, error } = await props.searchParams;
  const settings = await getSettings();

  const types = Object.keys(settings).sort();
  const selectedType = type && settings[type] ? type : types[0];
  const entries = selectedType ? Object.entries(settings[selectedType]) : [];

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      {types.length > 0 && <SettingsTypeSelect types={types} value={selectedType ?? ""} />}

      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-chart-2">{selectedType ?? "Settings"}</CardTitle>
          <CardDescription>
            Saving adds a new entry rather than overwriting — previous values stay in history.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!selectedType || entries.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SlidersHorizontalIcon />
                </EmptyMedia>
                <EmptyTitle>No settings in this group</EmptyTitle>
                <EmptyDescription>Configs added to this group will show up here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <form action={updateSettings} className="flex flex-col gap-4">
              <input type="hidden" name="_configType" value={selectedType} />

              {entries.map(([name, config]) => (
                <Field key={name} data-invalid={error === name || undefined}>
                  <input type="hidden" name="_configName" value={name} />
                  <input type="hidden" name={`description:${name}`} value={config.description} />
                  <FieldLabel htmlFor={name}>{name}</FieldLabel>
                  <Input
                    id={name}
                    name={`config:${name}`}
                    type="number"
                    step={1}
                    defaultValue={Number(config.value)}
                    required
                  />
                  <FieldDescription>{config.description}</FieldDescription>
                </Field>
              ))}

              {error === "save" && (
                <p className="text-sm text-red-600">Could not save. Check the server logs.</p>
              )}
              {error && error !== "save" && (
                <p className="text-sm text-red-600">
                  &ldquo;{error}&rdquo; must be a whole number — nothing was saved.
                </p>
              )}
              {saved && <p className="text-sm text-chart-2">Saved.</p>}

              <Button type="submit" className="w-full bg-chart-2 text-white hover:bg-chart-2/90">
                Save
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
