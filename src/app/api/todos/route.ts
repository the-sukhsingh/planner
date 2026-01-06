import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { todosTable, learningPlansTable, usersTable } from '@/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

// GET all todos for a specific plan or filtered by date
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Verify plan belongs to user
    const plans = await db
      .select()
      .from(learningPlansTable)
      .where(
        and(
          eq(learningPlansTable.id, parseInt(planId)),
          eq(learningPlansTable.userId, user.id)
        )
      )
      .limit(1);

    if (plans.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Build query
    let conditions = [eq(todosTable.planId, parseInt(planId))];

    if (dateFrom) {
      conditions.push(gte(todosTable.dueDate, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(todosTable.dueDate, new Date(dateTo)));
    }

    if (status) {
      conditions.push(eq(todosTable.status, status));
    }

    if (limit) {
      conditions.push(lte(todosTable.order, parseInt(limit)));
    }

    const todos = await db
      .select()
      .from(todosTable)
      .where(and(...conditions))
      .orderBy(todosTable.order, desc(todosTable.createdAt));

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// CREATE a new todo
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { planId, title, description, priority, dueDate, estimatedTime } = body;

    if (!planId || !title) {
      return NextResponse.json(
        { error: 'Plan ID and title are required' },
        { status: 400 }
      );
    }

    // Verify plan belongs to user
    const plans = await db
      .select()
      .from(learningPlansTable)
      .where(
        and(
          eq(learningPlansTable.id, planId),
          eq(learningPlansTable.userId, user.id)
        )
      )
      .limit(1);

    if (plans.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get the max order for this plan
    const existingTodos = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.planId, planId));

    const maxOrder = existingTodos.reduce((max, todo) => Math.max(max, todo.order), -1);

    const [newTodo] = await db
      .insert(todosTable)
      .values({
        planId,
        title,
        description: description || null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedTime: estimatedTime || null,
        order: maxOrder + 1,
      })
      .returning();

    return NextResponse.json({ todo: newTodo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
