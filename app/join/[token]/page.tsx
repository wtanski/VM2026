import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptInvite } from "@/app/dashboard/actions";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user ?? null;

  const { data: invite } = await supabase
    .from("group_invites")
    .select("token, groups(name)")
    .eq("token", token)
    .maybeSingle();

  const groupName = (invite as any)?.groups?.name as string | undefined;

  async function joinAction() {
    "use server";
    const res = await acceptInvite(token);
    if (!res.ok) return;
    redirect(`/dashboard`);
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Gå med i grupp</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="text-sm text-muted-foreground">
            {groupName ? (
              <>
                Du har blivit inbjuden till <span className="font-medium text-foreground">{groupName}</span>.
              </>
            ) : (
              <>Du har en inbjudningslänk.</>
            )}{" "}
            Logga in för att gå med.
          </div>
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}>Logga in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Gå med i grupp</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-sm text-muted-foreground">
          {groupName ? (
            <>
              Klicka för att gå med i <span className="font-medium text-foreground">{groupName}</span>.
            </>
          ) : (
            <>Klicka för att gå med i gruppen.</>
          )}
        </div>

        <form action={joinAction}>
          <Button type="submit">Gå med</Button>
        </form>

        <div className="text-xs text-muted-foreground">
          Efter att du gått med hittar du gruppen under <Link className="underline" href="/dashboard">Dashboard</Link>.
        </div>
      </CardContent>
    </Card>
  );
}

