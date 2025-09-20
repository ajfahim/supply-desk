import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Quotation } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const quotation = await Quotation.findById(id)
      .populate('client', 'companyName contacts address industry')
      .populate('items.product', 'name brand modelName specifications')
      .populate('items.selectedVendor', 'companyName contactPerson');
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Convert to plain object and manually populate clientContact
    const quotationObj = quotation.toObject();
    if (quotationObj.client && quotationObj.client.contacts) {
      const clientContactId = quotationObj.clientContact.toString();
      const contactInfo = quotationObj.client.contacts.find(
        (contact: any) => contact._id.toString() === clientContactId
      );
      if (contactInfo) {
        quotationObj.clientContact = contactInfo;
      }
    }
    
    return NextResponse.json(quotationObj);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
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
    const { status, ...updateData } = body;
    
    // If updating status to 'sent', set sentAt timestamp
    if (status === 'sent') {
      updateData.sentAt = new Date();
    }
    
    // If updating status to accepted/rejected, set respondedAt timestamp
    if (status === 'accepted' || status === 'rejected') {
      updateData.respondedAt = new Date();
    }
    
    const quotation = await Quotation.findByIdAndUpdate(
      id,
      { ...updateData, status },
      { new: true, runValidators: true }
    )
      .populate('client', 'companyName contacts address industry')
      .populate('items.product', 'name brand modelName')
      .populate('items.selectedVendor', 'companyName');
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Convert to plain object and manually populate clientContact
    const quotationObj = quotation.toObject();
    if (quotationObj.client && quotationObj.client.contacts) {
      const clientContactId = quotationObj.clientContact.toString();
      const contactInfo = quotationObj.client.contacts.find(
        (contact: any) => contact._id.toString() === clientContactId
      );
      if (contactInfo) {
        quotationObj.clientContact = contactInfo;
      }
    }
    
    return NextResponse.json(quotationObj);
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to update quotation' },
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
    const quotation = await Quotation.findByIdAndDelete(id);
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}
