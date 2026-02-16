"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateGroupButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setName("");
    setOpen(false);
    router.refresh();
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
              if (!loading) setOpen(false);
            }}
          />
          <Card className="relative z-10 w-full max-w-md">
            <CardHeader>
              <CardTitle>Skapa grupp</CardTitle>
            </CardHeader>
            <CardContent>
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
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={!name.trim() || loading}>
                    {loading ? "Skapar…" : "Skapa grupp"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

