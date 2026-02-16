import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreateGroupButton } from "./create-group-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    null;

  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const email = user?.email ?? null;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Överblick över dina grupper och poängställning.</p>
        </div>
        <CreateGroupButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Din profil</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="grid">
                <div className="font-medium leading-none">{name ?? "Inloggad användare"}</div>
                <div className="text-sm text-muted-foreground">{email ?? "—"}</div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="text-sm text-muted-foreground">
                Du är inte inloggad. Logga in för att se dina grupper och resultat.
              </div>
              <div>
                <Button asChild>
                  <Link href="/login">Logga in</Link>
                </Button>
              </div>
            </div>
          )}

          <Separator />

          <div className="grid gap-1 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">User id:</span>{" "}
              <span className="font-mono">{user?.id ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Senast inloggad:</span>{" "}
              <span className="font-mono">{user?.last_sign_in_at ?? "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="text-sm text-muted-foreground">
            Här kommer poängställningen för vald grupp att visas.
          </div>
          <div className="rounded-md border">
            <div className="grid grid-cols-[32px_1fr_60px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div>#</div>
              <div>Spelare</div>
              <div className="text-right">Poäng</div>
            </div>
            <Separator />
            <div className="px-3 py-3 text-sm text-muted-foreground">Ingen leaderboard-data ännu.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

