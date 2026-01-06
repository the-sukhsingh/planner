import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { todosTable, learningPlansTable, usersTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

// UPDATE a specific todo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const { id } = await params;
    const todoId = parseInt(id);
    const body = await request.json();

    // Get the todo and verify it belongs to user's plan
    const todos = await db
      .select({
        todo: todosTable,
        plan: learningPlansTable,
      })
      .from(todosTable)
      .innerJoin(learningPlansTable, eq(todosTable.planId, learningPlansTable.id))
      .where(
        and(
          eq(todosTable.id, todoId),
          eq(learningPlansTable.userId, user.id)
        )
      )
      .limit(1);

    if (todos.length === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.order !== undefined) updateData.order = body.order;
    if (body.estimatedTime !== undefined) updateData.estimatedTime = body.estimatedTime;
    if (body.actualTime !== undefined) updateData.actualTime = body.actualTime;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.resources !== undefined) updateData.resources = body.resources;

    const [updatedTodo] = await db
      .update(todosTable)
      .set(updateData)
      .where(eq(todosTable.id, todoId))
      .returning();

    return NextResponse.json({ todo: updatedTodo });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a specific todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const { id } = await params;
    const todoId = parseInt(id);

    // Get the todo and verify it belongs to user's plan
    const todos = await db
      .select({
        todo: todosTable,
        plan: learningPlansTable,
      })
      .from(todosTable)
      .innerJoin(learningPlansTable, eq(todosTable.planId, learningPlansTable.id))
      .where(
        and(
          eq(todosTable.id, todoId),
          eq(learningPlansTable.userId, user.id)
        )
      )
      .limit(1);

    if (todos.length === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    await db.delete(todosTable).where(eq(todosTable.id, todoId));

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
