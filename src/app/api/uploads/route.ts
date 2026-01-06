import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { uploadsTable, usersTable } from "@/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const uploads = await db
      .select()
      .from(uploadsTable)
      .where(eq(uploadsTable.userId, user.id))
      .orderBy(desc(uploadsTable.createdAt));

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('file');

    // Get user ID
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const results = [];

    for (const f of files) {
      if (f instanceof File) {
        const arrayBuffer = await f.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const [upload] = await db
          .insert(uploadsTable)
          .values({
            userId: user.id,
            fileName: f.name,
            fileType: f.type || 'application/octet-stream',
            fileSize: f.size,
            fileUrl: '', // placeholder, will replace with id-based URL
            metadata: { base64 },
          })
          .returning();

        // Update the fileUrl to point to a download path
        await db
          .update(uploadsTable)
          .set({ fileUrl: `/api/uploads/${upload.id}/download` })
          .where(eq(uploadsTable.id, upload.id));

        results.push({ id: upload.id, fileName: f.name, fileUrl: `/api/uploads/${upload.id}/download` });
      }
    }

    return NextResponse.json({ uploaded: results });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
