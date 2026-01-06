import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { learningPlansTable, usersTable } from '@/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET all plans for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    let query = db
      .select()
      .from(learningPlansTable)
      .where(eq(learningPlansTable.userId, user.id))
      .orderBy(desc(learningPlansTable.updatedAt));

    // Apply status filter if provided
    if (status) {
      const plans = await query;
      const filteredPlans = plans.filter(plan => plan.status === status);
      return NextResponse.json({ plans: filteredPlans });
    }

    const plans = await query;
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// CREATE a new plan
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
    const { title, description, goal, difficulty, estimatedDuration } = body;

    if (!title || !goal) {
      return NextResponse.json(
        { error: 'Title and goal are required' },
        { status: 400 }
      );
    }

    const [newPlan] = await db
      .insert(learningPlansTable)
      .values({
        userId: user.id,
        title,
        description: description || null,
        goal,
        difficulty: difficulty || 'intermediate',
        estimatedDuration: estimatedDuration || null,
      })
      .returning();

    return NextResponse.json({ plan: newPlan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
