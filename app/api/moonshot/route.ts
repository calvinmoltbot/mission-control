import { NextResponse } from 'next/server';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY || 'sk-N3Y1Cw1oSXktsOh7kBd4jcup88nMtiw54JMAbrpzJwnxKKR1';
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/users/me/balance';

export async function GET() {
  try {
    const res = await fetch(MOONSHOT_API_URL, {
      headers: {
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
      },
      next: { revalidate: 0 },
    });

    const data = await res.json();

    if (data.status === true && data.data) {
      return NextResponse.json({
        available_balance: data.data.available_balance ?? 0,
        cash_balance: data.data.cash_balance ?? 0,
        voucher_balance: data.data.voucher_balance ?? 0,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch balance', available_balance: 0, cash_balance: 0, voucher_balance: 0 },
      { status: 502 }
    );
  } catch (error) {
    console.error('Moonshot API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', available_balance: 0, cash_balance: 0, voucher_balance: 0 },
      { status: 500 }
    );
  }
}
