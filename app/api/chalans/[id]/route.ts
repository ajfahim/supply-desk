import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chalan from '@/lib/models/Chalan';
import Client from '@/lib/models/Client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const chalan = await Chalan.findById(id).lean();
    
    if (!chalan) {
      return NextResponse.json(
        { error: 'Chalan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chalan);
  } catch (error) {
    console.error('Error fetching chalan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chalan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    
    // If client is being updated, fetch client details
    if (body.client) {
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

      body.client = {
        _id: (client as any)._id,
        companyName: (client as any).companyName,
        address: (client as any).address,
        phone: (client as any).phone,
        email: (client as any).email
      };

      body.clientContact = {
        _id: contact._id,
        name: contact.name,
        title: contact.title,
        email: contact.email,
        phone: contact.phone
      };
    }

    const chalan = await Chalan.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!chalan) {
      return NextResponse.json(
        { error: 'Chalan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chalan);
  } catch (error) {
    console.error('Error updating chalan:', error);
    return NextResponse.json(
      { error: 'Failed to update chalan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const chalan = await Chalan.findByIdAndDelete(id);
    
    if (!chalan) {
      return NextResponse.json(
        { error: 'Chalan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Chalan deleted successfully' });
  } catch (error) {
    console.error('Error deleting chalan:', error);
    return NextResponse.json(
      { error: 'Failed to delete chalan' },
      { status: 500 }
    );
  }
}
