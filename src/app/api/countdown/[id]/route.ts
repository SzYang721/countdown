import { NextRequest, NextResponse } from 'next/server';
import { getCountdown, updateCountdown, deleteCountdown, Countdown } from '@/lib/simple-database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const countdown = await getCountdown(id);
    
    if (!countdown) {
      return NextResponse.json({ error: 'Countdown not found' }, { status: 404 });
    }
    
    return NextResponse.json({ countdown });
  } catch (error) {
    console.error('Error fetching countdown:', error);
    return NextResponse.json({ error: 'Failed to fetch countdown' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const updates: Partial<Omit<Countdown, 'id' | 'createdAt' | 'updatedAt'>> = {};
    
    if (data.title) updates.title = data.title;
    if (data.targetDate) updates.targetDate = data.targetDate;
    if (data.timezone) updates.timezone = data.timezone;
    if (data.location) updates.location = data.location;
    if (data.countType) updates.countType = data.countType;
    if (data.workingHours !== undefined) updates.workingHours = data.workingHours;
    if (data.customization) updates.customization = data.customization;
    
    await updateCountdown(id, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating countdown:', error);
    return NextResponse.json({ error: 'Failed to update countdown' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCountdown(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting countdown:', error);
    return NextResponse.json({ error: 'Failed to delete countdown' }, { status: 500 });
  }
}
