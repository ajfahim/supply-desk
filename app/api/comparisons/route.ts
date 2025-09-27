import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { ComparisonReport } from '@/lib/models/ProductComparison';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, clientName, requirementId, comparisons } = body;

    if (!title || !comparisons || comparisons.length === 0) {
      return NextResponse.json({ error: 'Title and at least one comparison are required' }, { status: 400 });
    }

    await connectDB();

    const comparisonReport = new ComparisonReport({
      title,
      clientName,
      requirementId,
      comparisons,
      createdBy: session.user.id,
    });

    await comparisonReport.save();

    return NextResponse.json({ 
      message: 'Comparison saved successfully', 
      id: comparisonReport._id 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving comparison:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const comparisons = await ComparisonReport.find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(comparisons);

  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
