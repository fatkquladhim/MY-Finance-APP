import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, bio, avatar } = body as { name?: string; bio?: string; avatar?: string };
    const user = await User.findOneAndUpdate({ id: session.user.id }, { name, bio, avatar });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Profile updated", user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal update profil" }, { status: 500 });
  }
}
