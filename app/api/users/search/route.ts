import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return new NextResponse("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", `%${q}%`)
    .limit(10);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ results: data ?? [] });
}

