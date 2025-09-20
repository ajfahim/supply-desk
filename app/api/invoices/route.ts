import { Invoice } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (clientId) filter.client = clientId;

    const invoices = await Invoice.find(filter)
      .populate("client", "companyName contacts")
      .populate("quotation", "quotationNumber")
      .populate("items.product", "name brand modelName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(filter);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      quotationId,
      purchaseOrderNumber,
      dueDate,
      createdBy,
    } = body;

    // Fetch the quotation to copy data from
    const { Quotation } = await import("@/lib/models");
    const quotation = await Quotation.findById(quotationId)
      .populate("client")
      .populate("items.product");

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Generate invoice number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-3);
    const invoiceNumber = `INV-${year}-${month}${day}-${timestamp}`;

    // Create invoice from quotation data
    const invoice = new Invoice({
      invoiceNumber,
      quotation: quotationId,
      quotationNumber: quotation.quotationNumber,
      purchaseOrderNumber,
      client: quotation.client._id,
      clientContact: quotation.clientContact,
      items: quotation.items.map((item: any) => ({
        product: item.product._id,
        productName: item.productName,
        brand: item.brand,
        modelName: item.modelName,
        specifications: item.specifications,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.sellingPrice,
        sellingPrice: item.sellingPrice,
        lineTotal: item.lineTotal,
        deliveryTime: item.deliveryTime,
        warranty: item.warranty,
        notes: item.notes,
      })),
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      discountType: quotation.discountType,
      transportationCost: quotation.transportationCost || 0,
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,
      deliveryTerms: quotation.deliveryTerms,
      paymentTerms: quotation.paymentTerms,
      warranty: quotation.warranty,
      termsAndInstructions: quotation.termsAndInstructions,
      notes: quotation.notes,
      dueDate: new Date(dueDate),
      createdBy,
    });

    await invoice.save();

    // Populate the created invoice
    await invoice.populate("client", "companyName contacts");
    await invoice.populate("quotation", "quotationNumber");
    await invoice.populate("items.product", "name brand modelName");

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
