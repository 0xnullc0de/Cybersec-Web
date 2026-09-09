import { NextResponse } from 'next/server';

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'nulbyt3-root';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password || password !== ADMIN_PASS) {
      return NextResponse.json({ success: false, error: 'Invalid admin passphrase' }, { status: 401 });
    }
    return NextResponse.json({ success: true, message: 'Authenticated as admin' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
