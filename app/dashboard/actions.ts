"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function getOriginFromHeaders(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function createGroup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, error: "Gruppnamn krävs." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { ok: false as const, error: "Du måste vara inloggad." };

  const userId = authData.user.id;

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, owner_id: userId })
    .select("id, name, owner_id")
    .single();

  if (groupError || !group) return { ok: false as const, error: groupError?.message ?? "Kunde inte skapa grupp." };

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, role: "owner" });

  if (memberError) return { ok: false as const, error: memberError.message };

  return { ok: true as const, group };
}

export async function listMyGroups() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user)
    return { ok: true as const, groups: [] as Array<{ id: string; name: string; created_by: string }> };

  const { data, error } = await supabase
    .from("group_members")
    .select("groups(id,name,owner_id)")
    .eq("user_id", authData.user.id);

  if (error) return { ok: false as const, error: error.message };

  const groups =
    (data ?? [])
      .map((row: any) => row.groups)
      .filter(Boolean)
      .map((g: any) => ({ id: g.id as string, name: g.name as string, created_by: g.owner_id as string })) ?? [];

  return { ok: true as const, groups };
}

export async function createInviteLink(groupId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false as const, error: "Du måste vara inloggad." };

  const token = crypto.randomBytes(24).toString("base64url");

  const { error } = await supabase.from("group_invites").insert({
    group_id: groupId,
    created_by: authData.user.id,
    token,
    // optional: set expiry, max_uses, etc.
  });

  if (error) return { ok: false as const, error: error.message };

  const h = await headers();
  const origin = getOriginFromHeaders(h);
  const url = `${origin}/join/${token}`;
  return { ok: true as const, url };
}

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false as const, error: "Du måste vara inloggad." };

  const { data: invite, error: inviteError } = await supabase
    .from("group_invites")
    .select("id, group_id, expires_at, max_uses, uses")
    .eq("token", token)
    .single();

  if (inviteError || !invite) return { ok: false as const, error: "Ogiltig inbjudan." };

  const now = new Date();
  if (invite.expires_at && new Date(invite.expires_at) < now) return { ok: false as const, error: "Inbjudan har gått ut." };
  if (invite.max_uses != null && invite.uses >= invite.max_uses)
    return { ok: false as const, error: "Inbjudan kan inte användas fler gånger." };

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: invite.group_id,
    user_id: authData.user.id,
    role: "member",
  });

  // If already member, treat as ok.
  if (memberError && !String(memberError.message).toLowerCase().includes("duplicate")) {
    return { ok: false as const, error: memberError.message };
  }

  const { error: bumpError } = await supabase
    .from("group_invites")
    .update({ uses: (invite.uses ?? 0) + 1 })
    .eq("id", invite.id);

  if (bumpError) return { ok: false as const, error: bumpError.message };

  return { ok: true as const, groupId: invite.group_id as string };
}

