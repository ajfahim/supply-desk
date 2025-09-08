import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Vendor } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');
    
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter: any = { isActive: true };
    if (specialty) filter.specialties = specialty;
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } },
      ];
    }
    
    const vendors = await Vendor.find(filter)
      .sort({ companyName: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Vendor.countDocuments(filter);
    
    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const vendor = new Vendor(body);
    await vendor.save();
    
    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
