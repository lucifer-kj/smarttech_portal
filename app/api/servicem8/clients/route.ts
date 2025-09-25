import { NextRequest, NextResponse } from 'next/server';
import servicem8 from '@api/servicem8';

export async function GET() {
  try {
    const { data } = await servicem8.listClients();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Failed to fetch ServiceM8 clients', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch ServiceM8 clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { data } = await servicem8.createClients(payload);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Failed to create ServiceM8 client', e);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create ServiceM8 client',
      message: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}


