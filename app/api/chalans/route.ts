import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Chalan, Client } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    
    // Build filter
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { chalanNumber: { $regex: search, $options: 'i' } },
        { 'client.companyName': { $regex: search, $options: 'i' } },
        { 'clientContact.name': { $regex: search, $options: 'i' } }
      ];
    }

    const chalans = await Chalan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Chalan.countDocuments(filter);

    return NextResponse.json({
      chalans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching chalans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chalans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Fetch client details
    const client = await Client.findById(body.client).lean();
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Find the selected contact
    const contact = (client as any).contacts.find((c: any) => c._id.toString() === body.clientContact);
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Generate chalan number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-3);
    const chalanNumber = `CHN-${year}-${month}${day}-${timestamp}`;

    // Create chalan data
    const chalanData = {
      chalanNumber,
      invoice: body.invoice || undefined, // Add invoice reference
      client: {
        _id: (client as any)._id,
        companyName: (client as any).companyName,
        address: (client as any).address,
        phone: (client as any).phone,
        email: (client as any).email
      },
      clientContact: {
        _id: contact._id,
        name: contact.name,
        title: contact.title,
        email: contact.email,
        phone: contact.phone
      },
      items: body.items,
      deliveryAddress: body.deliveryAddress,
      deliveryDate: new Date(body.deliveryDate),
      transportationDetails: body.transportationDetails,
      driverName: body.driverName,
      driverPhone: body.driverPhone,
      vehicleNumber: body.vehicleNumber,
      notes: body.notes,
      status: body.status || 'draft',
      createdBy: body.createdBy || 'System User'
    };

    const chalan = new Chalan(chalanData);
    await chalan.save();

    return NextResponse.json(chalan, { status: 201 });
  } catch (error) {
    console.error('Error creating chalan:', error);
    return NextResponse.json(
      { error: 'Failed to create chalan' },
      { status: 500 }
    );
  }
}
