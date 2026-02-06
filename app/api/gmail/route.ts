import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string;
  from: string;
  date: string;
  isUnread: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'is:unread';
    const max = parseInt(searchParams.get('max') || '20');

    // Fetch emails using gog
    const { stdout } = await execAsync(
      `gog gmail messages search "${query}" --max ${max} --account calvinmoltbot@gmail.com --json 2>/dev/null || echo '{"messages":[]}'`,
      { env: { ...process.env, GOG_ACCOUNT: 'calvinmoltbot@gmail.com' } }
    );

    const data = JSON.parse(stdout || '{"messages":[]}');
    const messages: EmailMessage[] = [];

    if (data.messages && Array.isArray(data.messages)) {
      for (const msg of data.messages) {
        try {
          // Extract headers
          const subject = msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown';
          const date = msg.payload?.headers?.find((h: any) => h.name === 'Date')?.value || '';
          
          messages.push({
            id: msg.id,
            threadId: msg.threadId,
            labelIds: msg.labelIds || [],
            snippet: msg.snippet || '',
            subject,
            from: from.replace(/<.*?>/, '').trim(), // Extract name from "Name <email>"
            date,
            isUnread: msg.labelIds?.includes('UNREAD') || false,
          });
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    }

    return NextResponse.json({ emails: messages });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails', emails: [] },
      { status: 500 }
    );
  }
}

// Mark email as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, markAsRead = true } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID required' },
        { status: 400 }
      );
    }

    // Use gog to modify labels
    const action = markAsRead ? 'remove' : 'add';
    await execAsync(
      `gog gmail messages modify ${messageId} --${action}-labels UNREAD --account calvinmoltbot@gmail.com`,
      { env: { ...process.env, GOG_ACCOUNT: 'calvinmoltbot@gmail.com' } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error modifying email:', error);
    return NextResponse.json(
      { error: 'Failed to modify email' },
      { status: 500 }
    );
  }
}