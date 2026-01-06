import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { todosTable, learningPlansTable, usersTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

// Bulk-shift pending todos' due dates by `days`. Optionally limit to a single plan via `planId`.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { days, planId } = body;

    if (typeof days !== 'number' || Number.isNaN(days)) {
      return NextResponse.json({ error: 'Invalid days' }, { status: 400 });
    }

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Fetch candidate todos that belong to the user's plans and have due dates and are not completed.
    const whereQuery: any[] = [eq(learningPlansTable.userId, user.id)];
    if (planId !== undefined && planId !== null) {
      whereQuery.push(eq(todosTable.planId, planId));
    }

    const candidates = await db
      .select({ todo: todosTable })
      .from(todosTable)
      .innerJoin(learningPlansTable, eq(todosTable.planId, learningPlansTable.id))
      .where(and(...whereQuery));

    // Filter on server side for dueDate & status
    const toShift = candidates
      .map(r => r.todo)
      .filter(t => t.dueDate && t.status !== 'completed');

    if (toShift.length === 0) {
      return NextResponse.json({ todos: [] });
    }

    // Update each todo's dueDate
    const updatedPromises = toShift.map(t => {
      // `dueDate` is filtered to be non-null above, use non-null assertion for the constructor.
      const newDate = new Date(t.dueDate!);
      newDate.setDate(newDate.getDate() + days);

      return db
        .update(todosTable)
        .set({ dueDate: newDate, updatedAt: new Date() })
        .where(eq(todosTable.id, t.id))
        .returning();
    });

    const updates = await Promise.all(updatedPromises);
    // Each element should be an array with the updated todo as first item
    const updatedTodos = updates.map(arr => arr[0]).filter(Boolean);

    return NextResponse.json({ todos: updatedTodos });
  } catch (error) {
    console.error('Error shifting todos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
