"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users } from "lucide-react";

type Group = {
  id: string;
  name: string;
};

type Member = {
  userId: string;
  role: string;
  displayName: string | null;
};

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    async function fetchGroupData() {
      const supabase = createClient();

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace(`/login?next=${encodeURIComponent(`/group/${groupId}`)}`);
        return;
      }

      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("id", groupId)
        .single();

      if (groupError || !groupData) {
        setError("Kunde inte hitta gruppen.");
        setLoading(false);
        return;
      }

      setGroup(groupData);

      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, role")
        .eq("group_id", groupId);

      if (membersError) {
        setError(membersError.message);
        setLoading(false);
        return;
      }

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id);

        // Fetch profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        const profilesMap = new Map<string, string | null>();
        for (const profile of profilesData ?? []) {
          profilesMap.set(profile.id, profile.display_name);
        }

        const membersList = membersData.map((m) => ({
          userId: m.user_id,
          role: m.role,
          displayName: profilesMap.get(m.user_id) ?? null,
        }));

        setMembers(membersList);
      }

      setLoading(false);
    }

    fetchGroupData();
  }, [groupId, router]);

  function getInitials(name: string | null): string {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="text-sm text-muted-foreground">Laddar grupp...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">Grupp</h1>
        </div>
        <div className="text-sm text-red-500">{error ?? "Kunde inte hitta gruppen."}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground">Gruppöversikt</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Medlemmar ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="grid gap-2">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(member.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm">
                      {member.displayName ?? "Okänd användare"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.role === "owner" ? "Ägare" : "Medlem"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Inga medlemmar hittades.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
