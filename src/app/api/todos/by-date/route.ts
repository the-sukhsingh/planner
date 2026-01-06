import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { todosTable, learningPlansTable, usersTable } from '@/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET all todos for a specific date
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
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Parse the date and create start/end of day
    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Set to start of day (00:00:00)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Set to end of day (23:59:59.999)
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all user's plans
    const userPlans = await db
      .select({ id: learningPlansTable.id })
      .from(learningPlansTable)
      .where(eq(learningPlansTable.userId, user.id));

    if (userPlans.length === 0) {
      return NextResponse.json({ todos: [] });
    }

    const planIds = userPlans.map(p => p.id);

    // Get todos for the specific date across all user's plans
    const todos = await db
      .select({
        id: todosTable.id,
        planId: todosTable.planId,
        title: todosTable.title,
        description: todosTable.description,
        status: todosTable.status,
        priority: todosTable.priority,
        dueDate: todosTable.dueDate,
        estimatedTime: todosTable.estimatedTime,
        resources: todosTable.resources,
        order: todosTable.order,
        notes: todosTable.notes,
        createdAt: todosTable.createdAt,
        updatedAt: todosTable.updatedAt,
        planTitle: learningPlansTable.title,
      })
      .from(todosTable)
      .leftJoin(learningPlansTable, eq(todosTable.planId, learningPlansTable.id))
      .where(
        and(
          sql`${todosTable.planId} IN ${planIds}`,
          sql`DATE(${todosTable.dueDate}) = DATE(${startOfDay})`
        )
      )
      .orderBy(todosTable.order);

    return NextResponse.json({ 
      todos,
      date: dateParam,
      count: todos.length 
    });
  } catch (error) {
    console.error('Error fetching todos by date:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
