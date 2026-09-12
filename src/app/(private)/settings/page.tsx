import { getSettings } from "@/actions/get-settings.action";
import { updateSettings } from "@/actions/update-settings.action";
import { SETTINGS } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export interface SettingsPageProps {
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const { saved, error } = await props.searchParams;
  const values = await getSettings();

  return (
    <div className="w-full max-w-[560px]">
      <Card>
        <CardHeader>
          <CardTitle>Calibration</CardTitle>
          <CardDescription>
            Tune these against real rides during commissioning. Changes take effect on the next
            dashboard load — no redeploy.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={updateSettings} className="flex flex-col gap-4">
            {SETTINGS.map((s) => (
              <Field key={s.key} data-invalid={error === s.key || undefined}>
                <FieldLabel htmlFor={s.key}>{s.label}</FieldLabel>
                <Input
                  id={s.key}
                  name={s.key}
                  type="number"
                  defaultValue={values[s.key]}
                  min={s.min}
                  max={s.max}
                  step={1}
                  required
                />
                <FieldDescription>
                  {s.help} ({s.min}–{s.max})
                </FieldDescription>
              </Field>
            ))}

            {error === "save" && (
              <p className="text-sm text-red-600">Could not save. Check the server logs.</p>
            )}
            {error && error !== "save" && (
              <p className="text-sm text-red-600">
                &ldquo;{error}&rdquo; is out of range — nothing was saved.
              </p>
            )}
            {saved && <p className="text-sm text-green-600">Saved.</p>}

            <Button type="submit" className="self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
