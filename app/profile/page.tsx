"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProfileRow = {
  id: string;
  display_name: string | null;
};

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError(null);
      setSaved(false);
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user ?? null;
      if (!mounted) return;

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent("/profile")}`);
        return;
      }

      setUserId(user.id);
      setEmail((user.email as string | undefined) ?? null);
      setAvatarUrl((user.user_metadata?.avatar_url as string | undefined) ?? null);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const row = profile as ProfileRow | null;
      setDisplayName(row?.display_name ?? "");
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setSaved(false);
    setSaving(true);

    const payload: ProfileRow = {
      id: userId,
      display_name: displayName.trim() || null,
    };

    const { error: upsertError } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const initials =
    (displayName || email || "U")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Grundinställningar för din profil. Mer kommer senare.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Profilinställningar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Laddar…</div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="grid">
                  <div className="text-sm font-medium">{displayName || "Inget visningsnamn"}</div>
                  <div className="text-sm text-muted-foreground">{email ?? ""}</div>
                </div>
              </div>

              <form onSubmit={onSave} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Smeknamn</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="t.ex. William"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Sparar…" : "Spara"}
                  </Button>
                  <Button type="button" variant="secondary" asChild>
                    <Link href="/dashboard">Till dashboard</Link>
                  </Button>
                  {saved ? <div className="text-sm text-muted-foreground">Sparat.</div> : null}
                </div>

                {error ? <div className="text-sm text-red-500">{error}</div> : null}
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

