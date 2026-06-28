import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as unknown as { role?: string }).role;
    if (userRole !== 'sys_admin' && userRole !== 'eng_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const department = searchParams.get('department');

    const filter: Record<string, unknown> = { deletedAt: null };
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (department) filter.department = department;

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminRole = (session.user as unknown as { role?: string }).role;
    if (adminRole !== 'sys_admin' && adminRole !== 'eng_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const adminId = session.user.id;
    const { userId, status, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const beforeState = {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();

    // Log admin approval/status change
    await AuditLog.create({
      actorId: adminId,
      actionType: status === 'active' ? 'ACCOUNT_APPROVED' : 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: user._id,
      beforeState,
      afterState: {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    return NextResponse.json({
      message: `User ${user.username} status updated to ${user.status}`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        department: user.department,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
