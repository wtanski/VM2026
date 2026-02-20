"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getGroupMembers, listMyGroups } from "../actions";
import { ExternalLink, Users } from "lucide-react";

type Group = { id: string; name: string };
type Member = {
  userId: string;
  role: string;
  profile: {
    id: string;
    displayName: string | null;
  } | null;
};

export function MyGroupsModule() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});

  useEffect(() => {
    async function fetchGroupsAndMembers() {
      setError(null);
      setLoading(true);
      const res = await listMyGroups();
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setGroups(res.groups);
      if (res.groups.length > 0) {
        setSelectedGroupId(res.groups[0].id);

        // Fetch all members for all groups in parallel
        const memberResults = await Promise.all(
          res.groups.map(async (group) => {
            const memberRes = await getGroupMembers(group.id);
            return { groupId: group.id, members: memberRes.ok ? memberRes.members : [] };
          })
        );

        const membersMap: Record<string, Member[]> = {};
        for (const result of memberResults) {
          membersMap[result.groupId] = result.members;
        }
        setMembers(membersMap);
      }
      setLoading(false);
    }
    fetchGroupsAndMembers();
  }, []);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Mina grupper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Laddar grupper...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Mina grupper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Mina grupper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Du är inte med i några grupper ännu. Skapa en grupp eller gå med via en inbjudningslänk.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          Mina grupper
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedGroupId ?? undefined}
          onValueChange={(value) => setSelectedGroupId(value)}
        >
          <TabsList className="w-full flex-wrap h-auto gap-1">
            {groups.map((group) => (
              <TabsTrigger key={group.id} value={group.id}>
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {groups.map((group) => (
            <TabsContent key={group.id} value={group.id}>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Medlemmar i {group.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {members[group.id]?.length ?? 0} medlemmar
                  </div>
                </div>
                {members[group.id]?.length ? (
                  <div className="grid gap-2">
                    {members[group.id].map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(member.profile?.displayName ?? null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-sm">
                            {member.profile?.displayName ?? "Okänd användare"}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {member.role === "owner" ? "Ägare" : "Medlem"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Inga medlemmar hittades.</div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <Button asChild>
                    <Link href={`/group/${group.id}`}>
                      <ExternalLink className="size-4 mr-2" />
                      Öppna grupp
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
