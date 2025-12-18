import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Portfolio from "@/models/Portfolio";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const items = await Portfolio.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengambil portofolio" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    await connectToDatabase();
    const p = new Portfolio({ ...body, userId: session.user.id });
    await p.save();
    return NextResponse.json(p, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menyimpan portofolio" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...updates } = body as any;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await connectToDatabase();
    const p = await Portfolio.findOneAndUpdate({ _id: id, userId: session.user.id }, updates, { new: true });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengupdate portofolio" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const body = await req.json().catch(() => ({}));
    const payloadId = (body && (body as any).id) || id;
    if (!payloadId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await connectToDatabase();
    const res = await Portfolio.findOneAndDelete({ _id: payloadId, userId: session.user.id });
    if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus portofolio" }, { status: 500 });
  }
}
