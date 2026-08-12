import { NextRequest, NextResponse } from "next/server";
import { isValidStatus, updateTaskStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "ID tugas tidak valid." }, { status: 400 });
    }

    const body = await request.json();
    if (!isValidStatus(body.status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }

    const task = await updateTaskStatus(id, body.status);
    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengubah status tugas." }, { status: 500 });
  }
}
