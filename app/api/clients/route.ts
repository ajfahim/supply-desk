import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Client } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter: any = { isActive: true };
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { 'contacts.name': { $regex: search, $options: 'i' } },
        { 'contacts.email': { $regex: search, $options: 'i' } },
      ];
    }
    
    const clients = await Client.find(filter)
      .sort({ companyName: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Client.countDocuments(filter);
    
    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const client = new Client(body);
    await client.save();
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
