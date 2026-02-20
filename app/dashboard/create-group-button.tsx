"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup, createInviteLink } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, Copy } from "lucide-react";

export function CreateGroupButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdGroup, setCreatedGroup] = useState<{ id: string; name: string } | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function resetAndClose() {
    setName("");
    setCreatedGroup(null);
    setInviteUrl(null);
    setCopied(false);
    setError(null);
    setOpen(false);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.set("name", name);

    const res = await createGroup(fd);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setCreatedGroup({ id: res.group.id, name: res.group.name });

    // Auto-generate invite link
    setInviteLoading(true);
    const inviteRes = await createInviteLink(res.group.id);
    setInviteLoading(false);
    if (inviteRes.ok) {
      setInviteUrl(inviteRes.url);
    }
  }

  async function copyToClipboard() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Skapa grupp
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={() => {
              if (!loading && !inviteLoading) resetAndClose();
            }}
          />
          <Card className="relative z-10 w-full max-w-md">
            <CardHeader>
              <CardTitle>{createdGroup ? "Grupp skapad!" : "Skapa grupp"}</CardTitle>
            </CardHeader>
            <CardContent>
              {createdGroup ? (
                <div className="grid gap-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{createdGroup.name}</span> har skapats.
                    Bjud in vänner genom att dela länken nedan.
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label>Inbjudningslänk</Label>
                    {inviteLoading ? (
                      <div className="text-sm text-muted-foreground">Skapar länk...</div>
                    ) : inviteUrl ? (
                      <div className="flex gap-2">
                        <Input value={inviteUrl} readOnly className="font-mono text-xs" />
                        <Button type="button" variant="secondary" onClick={copyToClipboard}>
                          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-red-500">Kunde inte skapa inbjudningslänk.</div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={resetAndClose}>
                      Klar
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Gruppnamn</Label>
                    <Input
                      id="group-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="t.ex. Kompisgänget"
                      autoFocus
                    />
                  </div>

                  {error ? <p className="text-sm text-red-500">{error}</p> : null}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resetAndClose}
                      disabled={loading}
                    >
                      Avbryt
                    </Button>
                    <Button type="submit" disabled={!name.trim() || loading}>
                      {loading ? "Skapar…" : "Skapa grupp"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

