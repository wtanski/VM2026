"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createGroup, createInviteLink, listMyGroups } from "../actions";

type Group = { id: string; name: string };
type Profile = { id: string; display_name: string | null; avatar_url: string | null };

export function GroupsPanel() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Profile[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  async function refreshGroups() {
    setError(null);
    setLoading(true);
    const res = await listMyGroups();
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setGroups(res.groups);
    setSelectedGroupId((prev) => prev ?? res.groups[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refreshGroups();
  }, []);

  async function onCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteUrl(null);
    const fd = new FormData();
    fd.set("name", newGroupName);
    const res = await createGroup(fd);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNewGroupName("");
    await refreshGroups();
    setSelectedGroupId(res.group.id);
  }

  async function onGenerateInvite() {
    if (!selectedGroupId) return;
    setInviteError(null);
    setInviteUrl(null);
    setInviteLoading(true);
    const res = await createInviteLink(selectedGroupId);
    if (!res.ok) {
      setInviteError(res.error);
      setInviteLoading(false);
      return;
    }
    setInviteUrl(res.url);
    setInviteLoading(false);
  }

  async function runSearch(nextQ: string) {
    setSearchError(null);
    setSearching(true);
    try {
      const url = `/api/users/search?q=${encodeURIComponent(nextQ)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(await resp.text());
      const json = (await resp.json()) as { results: Profile[] };
      setResults(json.results);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Sökning misslyckades.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Groups</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-sm text-muted-foreground">
          Skapa en grupp, bjud in vänner via länk eller lägg till användare genom att söka.
        </div>

        <form onSubmit={onCreateGroup} className="grid gap-2">
          <Label htmlFor="groupName">Skapa ny grupp</Label>
          <div className="flex gap-2">
            <Input
              id="groupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="t.ex. Kompisgänget"
            />
            <Button type="submit" disabled={!newGroupName.trim()}>
              Skapa
            </Button>
          </div>
        </form>

        <Separator />

        <div className="grid gap-2">
          <div className="text-sm font-medium">Dina grupper</div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Laddar…</div>
          ) : groups.length ? (
            <div className="grid gap-2">
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <Button
                    key={g.id}
                    type="button"
                    variant={g.id === selectedGroupId ? "default" : "secondary"}
                    onClick={() => {
                      setSelectedGroupId(g.id);
                      setInviteUrl(null);
                      setInviteError(null);
                    }}
                  >
                    {g.name}
                  </Button>
                ))}
              </div>

              <div className="rounded-md border p-3">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm">
                      Vald grupp: <span className="font-medium">{selectedGroup?.name ?? "—"}</span>
                    </div>
                    <Button type="button" onClick={onGenerateInvite} disabled={!selectedGroupId || inviteLoading}>
                      {inviteLoading ? "Skapar länk…" : "Skapa inbjudningslänk"}
                    </Button>
                  </div>

                  {inviteError ? <div className="text-sm text-red-500">{inviteError}</div> : null}

                  {inviteUrl ? (
                    <div className="grid gap-1">
                      <div className="text-xs text-muted-foreground">Dela denna länk:</div>
                      <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
                        <code className="text-xs">{inviteUrl}</code>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={async () => {
                            await navigator.clipboard.writeText(inviteUrl);
                          }}
                        >
                          Kopiera
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        (Testa själv:{" "}
                        <Link className="underline" href={inviteUrl}>
                          öppna länken
                        </Link>
                        )
                      </div>
                    </div>
                  ) : null}

                  <Separator />

                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Sök användare</div>
                    <div className="flex gap-2">
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Sök på display name…"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={q.trim().length < 2 || searching || !selectedGroupId}
                        onClick={() => runSearch(q.trim())}
                      >
                        {searching ? "Söker…" : "Sök"}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tips: minst 2 tecken. (Att “lägga till” en användare kommer i nästa steg.)
                    </div>

                    {searchError ? <div className="text-sm text-red-500">{searchError}</div> : null}

                    {results.length ? (
                      <div className="grid gap-2">
                        {results.map((p) => (
                          <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{p.display_name ?? "—"}</div>
                              <div className="truncate font-mono text-xs text-muted-foreground">{p.id}</div>
                            </div>
                            <Button type="button" disabled>
                              Lägg till
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : q.trim().length >= 2 && !searching ? (
                      <div className="text-sm text-muted-foreground">Inga träffar.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Inga grupper ännu.</div>
          )}
        </div>

        {error ? <div className="text-sm text-red-500">{error}</div> : null}
      </CardContent>
    </Card>
  );
}

