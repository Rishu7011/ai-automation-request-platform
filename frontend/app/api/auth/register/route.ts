import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { DEPARTMENTS } from '@/constants';

export async function POST(req: Request) {
  try {
    const { name, email, username, password, department } = await req.json();

    if (!name || !email || !username || !password || !department) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!DEPARTMENTS.includes(department)) {
      return NextResponse.json(
        { error: 'Invalid department selected' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'This username is already taken' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      department,
      role: 'requester',
      status: 'pending_approval',
    });

    // Create Audit Log
    await AuditLog.create({
      actorId: newUser._id,
      actionType: 'ACCOUNT_REGISTERED_PENDING_APPROVAL',
      entityType: 'User',
      entityId: newUser._id,
      afterState: {
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        department: newUser.department,
        status: newUser.status,
      },
    });

    return NextResponse.json(
      {
        message:
          'Account request submitted successfully! Your account is pending backend/admin approval before you can log in.',
        userId: newUser._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during account creation' },
      { status: 500 }
    );
  }
}
