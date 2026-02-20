import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, Goal, Handshake, Calendar } from "lucide-react";

export default function Home() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">VM-tips 2026</h1>
        <p className="text-muted-foreground">
          Följ VM 2026 - matcher, resultat och statistik.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[32px_1fr_60px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div>#</div>
              <div>Spelare</div>
              <div className="text-right">Poäng</div>
            </div>
            <Separator />
            <div className="px-3 py-6 text-sm text-muted-foreground text-center">
              Leaderboard kommer att visas här när turneringen börjar.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4" />
              Matchresultat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Resultat från spelade matcher visas här.
            </div>
            <div className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              Kommer snart
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Goal className="size-4" />
              Skytteliga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Turneringens främsta målskyttar.
            </div>
            <div className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              Kommer snart
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Handshake className="size-4" />
              Assistliga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Turneringens bästa assisterare.
            </div>
            <div className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              Kommer snart
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
