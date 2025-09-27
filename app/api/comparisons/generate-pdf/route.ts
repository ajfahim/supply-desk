import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ReactPDF from '@react-pdf/renderer';
import React from 'react';
import { ComparisonPDFDocument } from '@/components/pdf/ComparisonPDFDocument';

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

    // Generate PDF
    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(ComparisonPDFDocument, {
        title,
        clientName,
        requirementId,
        comparisons,
        createdBy: session.user.username,
        createdAt: new Date(),
      })
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9\s]/g, '_').trim() || 'product-comparison'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
