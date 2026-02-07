import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Portfolio } from "@/models/Portfolio";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await Portfolio.findByUserId(session.user.id);
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
    const { name, type, symbol, quantity, averagePrice, currentPrice, purchaseDate } = body;
    
    // Calculate total value
    const totalValue = quantity * currentPrice;
    
    const p = await Portfolio.create({
      userId: session.user.id,
      name,
      type,
      symbol,
      quantity: String(quantity),
      averagePrice: String(averagePrice),
      currentPrice: String(currentPrice),
      totalValue: String(totalValue),
      purchaseDate: new Date(purchaseDate),
    });
    
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
    const { id, ...updates } = body as { id: string } & Record<string, unknown>;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    
    // Verify ownership
    const existing = await Portfolio.findById(id);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    // Recalculate total value if quantity or currentPrice is updated
    if ('quantity' in updates || 'currentPrice' in updates) {
      const quantity = Number(updates.quantity ?? existing.quantity);
      const currentPrice = Number(updates.currentPrice ?? existing.currentPrice);
      updates.totalValue = String(quantity * currentPrice);
    }
    
    const p = await Portfolio.update(id, updates);
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
    
    // Verify ownership
    const existing = await Portfolio.findById(payloadId);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    const res = await Portfolio.delete(payloadId);
    if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus portofolio" }, { status: 500 });
  }
}
