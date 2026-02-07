import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Finance, { UpdateFinanceInput } from "@/models/Finance";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const finances = await Finance.find({ userId: session.user.id });
    return NextResponse.json(finances);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const finance = await Finance.create({ ...body, user_id: session.user.id });
    return NextResponse.json(finance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...updates } = body as { id: string } & UpdateFinanceInput;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const finance = await Finance.findOneAndUpdate({ id, userId: session.user.id }, updates);
    if (!finance) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(finance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // try query param first
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const body = await req.json().catch(() => ({}));
    const payloadId = (body && typeof body === 'object' && 'id' in body) ? (body as { id: string }).id : id;
    if (!payloadId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const res = await Finance.findOneAndDelete({ id: payloadId, userId: session.user.id });
    if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
