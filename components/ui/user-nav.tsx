"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export function UserNav() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<HeaderUser | null>(null);
  const [loading, setLoading] = useState(true);

  function mapUser(u: any): HeaderUser {
    const name =
      (u?.user_metadata?.full_name as string | undefined) ??
      (u?.user_metadata?.name as string | undefined) ??
      null;
    const avatarUrl = (u?.user_metadata?.avatar_url as string | undefined) ?? null;
    return { id: u.id as string, email: (u.email as string | undefined) ?? null, name, avatarUrl };
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ? mapUser(data.user) : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  if (loading) {
    return (
      <Button variant="ghost" className="h-9 w-9 rounded-full" aria-label="Laddar användare" disabled />
    );
  }

  if (!user) {
    return (
      <Button asChild>
        <Link href="/login">Logga in</Link>
      </Button>
    );
  }

  const initials =
    (user.name ?? user.email ?? "U")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-full p-0" aria-label="Öppna användarmeny">
          <Avatar size="sm">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="grid gap-0.5">
          <div className="truncate text-sm font-medium">{user.name ?? "Inloggad"}</div>
          <div className="truncate text-xs font-normal text-muted-foreground">{user.email ?? ""}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          Logga ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

