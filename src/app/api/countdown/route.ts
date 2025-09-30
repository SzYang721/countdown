import { NextRequest, NextResponse } from 'next/server';
import { createCountdown, getAllCountdowns } from '@/lib/simple-database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const countdown = {
      title: data.title,
      targetDate: data.targetDate,
      timezone: data.timezone,
      location: data.location,
      countType: data.countType,
      workingHours: data.workingHours,
      customization: {
        backgroundColor: data.customization?.backgroundColor || '#ffffff',
        textColor: data.customization?.textColor || '#1a1a1a',
        titleColor: data.customization?.titleColor || '#000000',
        fontFamily: data.customization?.fontFamily || 'Arial, sans-serif',
        fontSize: data.customization?.fontSize || '18px',
      },
    };
    
    const id = await createCountdown(countdown);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating countdown:', error);
    return NextResponse.json({ error: 'Failed to create countdown' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const countdowns = await getAllCountdowns();
    return NextResponse.json({ countdowns });
  } catch (error) {
    console.error('Error fetching countdowns:', error);
    return NextResponse.json({ error: 'Failed to fetch countdowns' }, { status: 500 });
  }
}
