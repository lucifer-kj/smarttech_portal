import { NextRequest, NextResponse } from 'next/server';
import { serviceM8Client } from '@/services/servicem8-client';

export async function GET() {
  try {
    const resp = await serviceM8Client.getClients();
    return NextResponse.json({ success: true, data: resp.data });
  } catch (e) {
    console.error('Failed to fetch ServiceM8 clients', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch ServiceM8 clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const created = await serviceM8Client.createClient(payload);
    return NextResponse.json({ success: true, data: created });
  } catch (e) {
    console.error('Failed to create ServiceM8 client', e);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create ServiceM8 client',
      message: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}


