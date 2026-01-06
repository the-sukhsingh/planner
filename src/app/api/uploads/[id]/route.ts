import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { uploadsTable, usersTable } from "@/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Get user ID
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [upload] = await db
      .select()
      .from(uploadsTable)
      .where(eq(uploadsTable.id, id))
      .limit(1);

    if (!upload || upload.userId !== user.id) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    await db.delete(uploadsTable).where(eq(uploadsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
