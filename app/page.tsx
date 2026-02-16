"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">VM-tips 2026</h1>
        <p className="text-muted-foreground">
          Skapa en grupp, bjud in kompisar och tippa matcher.
        </p>
        <div className="flex gap-2 pt-2">
          <Button asChild>
            <Link href="/login">Kom igång</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Gå till dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Skapa grupp</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Starta en grupp för dig och dina vänner.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tippa</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Lägg dina tips inför varje match.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Följ poängställningen live.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
