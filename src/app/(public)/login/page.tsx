'use server';

import { login } from "@/actions/login.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface LoginPageProps {
  searchParams: Promise<{
    error?: 'config' | 'passcode';
  }>
}

export default async function LoginPage(props: LoginPageProps) {
  const { error } = await props.searchParams;
  let message = '';

  switch (error) {
    case 'config':
      message = 'Dashboard passcode is not configured on the server.';
      break;

    case 'passcode':
      message = 'Incorrect passcode.';
      break;
  }

  return (
    <div className="h-full w-full flex flex-1 items-center justify-center bg-[#153f34]">
      <div className="flex w-full max-w-sm items-center">
        <Card className="w-full border-t-4 border-t-chart-2">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#153f34] to-[#0a1f19] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/CX-Email-Signature.png" alt="Clarens Xtreme" className="h-16 w-auto object-contain" />
            </div>
            <CardDescription>Enter the dashboard passcode to continue.</CardDescription>
          </CardHeader>

          <CardContent>
            <form action={login} className="flex flex-col gap-3">
              <Field>
                <Input id="passcode" name="passcode" type="password" placeholder="Passcode" autoFocus autoComplete="current-password" required />
              </Field>

              {error ? <p className="text-sm text-red-600">{message}</p> : null}

              <Button type="submit" className="bg-chart-2 text-white hover:bg-chart-2/90">Enter</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
