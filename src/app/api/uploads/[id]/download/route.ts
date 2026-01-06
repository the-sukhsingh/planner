import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { uploadsTable, usersTable } from "@/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);

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

    const metadata = upload.metadata as { base64?: string } | null | undefined;
    const base64 = metadata?.base64;
    if (!base64) {
      return NextResponse.json({ error: "No file data available" }, { status: 404 });
    }

    const buffer = Buffer.from(base64, 'base64');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': upload.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${upload.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
