import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Portfolio from "@/models/Portfolio";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await Portfolio.find({ userId: session.user.id });
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
    const p = await Portfolio.create({ ...body, user_id: session.user.id });
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
    const { id, ...updates } = body as { id: string } & { asset?: string; type?: string; quantity?: number; current_value?: number; purchase_price?: number };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const p = await Portfolio.findOneAndUpdate({ id, userId: session.user.id }, updates as { asset?: string; type?: 'stock' | 'crypto' | 'fund' | 'property'; quantity?: number; current_value?: number; purchase_price?: number });
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
    const payloadId = (body && typeof body === 'object' && 'id' in body) ? (body as { id: string }).id : id;
    if (!payloadId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const res = await Portfolio.findOneAndDelete({ id: payloadId, userId: session.user.id });
    if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus portofolio" }, { status: 500 });
  }
}
