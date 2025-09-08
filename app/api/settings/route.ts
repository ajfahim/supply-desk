import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Settings } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();
    
    const settings = await Settings.findOne() || {};
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      {},
      body,
      { new: true, upsert: true, runValidators: true }
    );
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
