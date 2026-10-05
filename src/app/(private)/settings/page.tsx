import { format } from "date-fns";
import { SlidersHorizontalIcon } from "lucide-react";

import { createSetting } from "@/actions/create-setting.action";
import { getSettings } from "@/actions/get-settings.action";
import { updateSettings } from "@/actions/update-settings.action";
import { SettingsProfileSelect } from "@/components/settings/settings-profile-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SETTING_FIELDS } from "@/constants";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  setting_name: "A profile name is required.",
  exists: "A settings profile with that name already exists.",
  save: "Could not save. Check the server logs.",
};

export interface SettingsPageProps {
  searchParams: Promise<{ id?: string; saved?: string; error?: string; created?: string; createError?: string }>;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const { id, saved, error, created, createError } = await props.searchParams;
  const settings = await getSettings();

  const setting = settings.find((s) => s.settingId === id) ?? settings[0];
  const fieldError = SETTING_FIELDS.find((f) => f.name === error);
  const createFieldError = SETTING_FIELDS.find((f) => f.name === createError);

  return (
    <div className="flex w-full flex-col gap-4">
      {settings.length > 0 && (
        <SettingsProfileSelect
          items={settings.map((s) => ({ value: s.settingId, label: s.settingName }))}
          value={setting?.settingId ?? ""}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-chart-2">{setting?.settingName ?? "Settings"}</CardTitle>
            {setting && (
              <CardDescription>
                Last updated {format(new Date(setting.updatedAt), "MMM d, yyyy HH:mm")}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            {!setting ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SlidersHorizontalIcon />
                  </EmptyMedia>
                  <EmptyTitle>No settings profiles</EmptyTitle>
                  <EmptyDescription>Create your first profile below.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <form key={setting.settingId} action={updateSettings} className="flex flex-col gap-4">
                <input type="hidden" name="setting_id" value={setting.settingId} />

                <Field data-invalid={error === "setting_name" || error === "exists" || undefined}>
                  <FieldLabel htmlFor="setting_name">Profile Name</FieldLabel>
                  <Input id="setting_name" name="setting_name" defaultValue={setting.settingName} required />
                </Field>

                {SETTING_FIELDS.map((field) => (
                  <Field key={field.name} data-invalid={error === field.name || undefined}>
                    <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={setting[toKey(field.name)]}
                      required
                    />
                    <FieldDescription>{field.description}</FieldDescription>
                  </Field>
                ))}

                {fieldError && (
                  <p className="text-sm text-red-600">
                    &ldquo;{fieldError.label}&rdquo; must be a whole number of 0 or more — nothing was saved.
                  </p>
                )}
                {error && !fieldError && (
                  <p className="text-sm text-red-600">{ERRORS[error] ?? ERRORS.save}</p>
                )}
                {saved && <p className="text-sm text-chart-2">Saved.</p>}
                {created && <p className="text-sm text-chart-2">Profile created.</p>}

                <Button type="submit" className="w-full bg-chart-2 text-white hover:bg-chart-2/90">
                  Save
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-chart-2">New Profile</CardTitle>
            <CardDescription>
              {setting
                ? `Values start from ${setting.settingName}. Assign readers to the new profile on the Readers page.`
                : "Assign readers to the new profile on the Readers page."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={createSetting} className="flex flex-col gap-4">
              <Field data-invalid={createError === "setting_name" || createError === "exists" || undefined}>
                <FieldLabel htmlFor="new_setting_name">Profile Name</FieldLabel>
                <Input id="new_setting_name" name="setting_name" required />
              </Field>

              {SETTING_FIELDS.map((field) => (
                <Field key={field.name} data-invalid={createError === field.name || undefined}>
                  <FieldLabel htmlFor={`new_${field.name}`}>{field.label}</FieldLabel>
                  <Input
                    id={`new_${field.name}`}
                    name={field.name}
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={setting ? setting[toKey(field.name)] : field.defaultValue}
                    required
                  />
                </Field>
              ))}

              {createFieldError && (
                <p className="text-sm text-red-600">
                  &ldquo;{createFieldError.label}&rdquo; must be a whole number of 0 or more — nothing was created.
                </p>
              )}
              {createError && !createFieldError && (
                <p className="text-sm text-red-600">{ERRORS[createError] ?? ERRORS.save}</p>
              )}

              <Button type="submit" className="w-full bg-chart-2 text-white hover:bg-chart-2/90">
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** session_gap -> sessionGap, matching the Setting DTO. */
function toKey<T extends string>(name: T) {
  return name.replace(/_(\w)/g, (_, c: string) => c.toUpperCase()) as SnakeToCamel<T>;
}

type SnakeToCamel<S extends string> = S extends `${infer H}_${infer T}`
  ? `${H}${Capitalize<SnakeToCamel<T>>}`
  : S;
