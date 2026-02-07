import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Get GOG account from environment variable or default
const GOG_ACCOUNT = process.env.GOG_ACCOUNT || 'calvinmoltbot@gmail.com';

// Sanitize gmail query to prevent shell injection
function sanitizeGmailQuery(query: string): string {
  // Remove any characters that could be used for shell injection
  // Gmail search queries only need: alphanumeric, spaces, quotes, colons, operators
  return query.replace(/[;&|`$(){}[\]\\]/g, '');
}

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
    const rawQuery = searchParams.get('q') || 'is:unread';
    const query = sanitizeGmailQuery(rawQuery);
    const max = parseInt(searchParams.get('max') || '20');

    // Fetch emails using gog - use execFile for security (array args, no shell interpolation)
    const { stdout } = await execFileAsync(
      'gog',
      ['gmail', 'messages', 'search', query, '--max', max.toString(), '--account', GOG_ACCOUNT, '--json'],
      { env: { ...process.env, GOG_ACCOUNT } }
    ).catch(() => ({ stdout: '{"messages":[]}' }));

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

    // Use gog to modify labels - use execFile for security
    const action = markAsRead ? 'remove' : 'add';
    const labelFlag = `--${action}-labels`;
    await execFileAsync(
      'gog',
      ['gmail', 'messages', 'modify', messageId, labelFlag, 'UNREAD', '--account', GOG_ACCOUNT],
      { env: { ...process.env, GOG_ACCOUNT } }
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