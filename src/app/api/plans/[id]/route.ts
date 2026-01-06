import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { learningPlansTable, usersTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

// GET a specific plan
export async function GET(
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
    const planId = parseInt(id);

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

    return NextResponse.json({ plan: plans[0] });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE a specific plan
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
    const planId = parseInt(id);
    const body = await request.json();

    // Verify plan belongs to user
    const existingPlans = await db
      .select()
      .from(learningPlansTable)
      .where(
        and(
          eq(learningPlansTable.id, planId),
          eq(learningPlansTable.userId, user.id)
        )
      )
      .limit(1);

    if (existingPlans.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.goal !== undefined) updateData.goal = body.goal;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.estimatedDuration !== undefined) updateData.estimatedDuration = body.estimatedDuration;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.progress !== undefined) updateData.progress = body.progress;

    const [updatedPlan] = await db
      .update(learningPlansTable)
      .set(updateData)
      .where(eq(learningPlansTable.id, planId))
      .returning();

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a specific plan
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
    const planId = parseInt(id);

    // Verify plan belongs to user
    const existingPlans = await db
      .select()
      .from(learningPlansTable)
      .where(
        and(
          eq(learningPlansTable.id, planId),
          eq(learningPlansTable.userId, user.id)
        )
      )
      .limit(1);

    if (existingPlans.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await db
      .delete(learningPlansTable)
      .where(eq(learningPlansTable.id, planId));

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
