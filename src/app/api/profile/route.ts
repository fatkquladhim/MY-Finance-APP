import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name } = body as { name?: string };
    const user = await User.update(session.user.id, { name });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Profile updated", user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal update profil" }, { status: 500 });
  }
}
