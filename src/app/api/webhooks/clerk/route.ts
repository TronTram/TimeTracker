import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Clerk webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt);
        break;
      case 'user.updated':
        await handleUserUpdated(evt);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt);
        break;
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling webhook event ${eventType}:`, error);
    return new Response('Error processing webhook', {
      status: 500,
    });
  }
}

async function handleUserCreated(evt: WebhookEvent) {
  const data = evt.data as any; // Type assertion for webhook data
  const { id, email_addresses, first_name, last_name, image_url } = data;

  try {
    // Create user in database with default preferences
    const user = await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses?.[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        imageUrl: image_url || '',
        preferences: {
          create: {
            theme: 'system',
            pomodoroWorkDuration: 25,
            pomodoroShortBreakDuration: 5,
            pomodoroLongBreakDuration: 15,
            pomodoroLongBreakInterval: 4,
            soundEnabled: true,
            notificationsEnabled: true,
            autoStartBreaks: false,
            autoStartPomodoros: false,
          },
        },
      },
      include: { preferences: true },
    });

    console.log(`User created in database: ${user.id}`);
  } catch (error) {
    console.error('Error creating user in database:', error);
    throw error;
  }
}

async function handleUserUpdated(evt: WebhookEvent) {
  const data = evt.data as any; // Type assertion for webhook data
  const { id, email_addresses, first_name, last_name, image_url } = data;

  try {
    // Update user in database
    await prisma.user.update({
      where: { clerkId: id },
      data: {
        email: email_addresses?.[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        imageUrl: image_url || '',
      },
    });

    console.log(`User updated in database: ${id}`);
  } catch (error) {
    console.error('Error updating user in database:', error);
    throw error;
  }
}

async function handleUserDeleted(evt: WebhookEvent) {
  const { id } = evt.data;

  try {
    // Delete user from database (cascade will handle related data)
    await prisma.user.delete({
      where: { clerkId: id },
    });

    console.log(`User deleted from database: ${id}`);
  } catch (error) {
    console.error('Error deleting user from database:', error);
    throw error;
  }
} 