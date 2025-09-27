import { Quotation } from "@/lib/models";
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

    const quotations = await Quotation.find(filter)
      .populate("client", "companyName contacts")
      .populate("items.product", "name brand modelName")
      .populate("items.selectedVendor", "companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Quotation.countDocuments(filter);

    return NextResponse.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      client,
      clientContact,
      items,
      validUntil,
      deliveryTerms,
      paymentTerms,
      warranty,
      termsAndInstructions,
      notes,
      createdBy,
      discount = 0,
      discountType = "percentage",
      transportationCost = 0,
      taxRate = 0,
    } = body;
    console.log({ transportationCost });

    // Calculate totals and profit summary
    let subtotal = 0;
    const marginByItem = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lineTotal = item.sellingPrice * item.quantity;
      subtotal += lineTotal;

      const cost = item.vendorCost * item.quantity;
      const profit = lineTotal - cost;
      const margin = cost > 0 ? (profit / cost) * 100 : 0;

      marginByItem.push({
        itemId: item.product, // Use the product ObjectId instead of timestamp
        cost,
        profit,
        margin,
      });
    }

    // Apply discount
    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const afterDiscount = subtotal - discountAmount;
    // Tax should only be calculated on product prices, not transportation cost
    const taxAmount = (afterDiscount * taxRate) / 100;
    const grandTotal = afterDiscount + transportationCost + taxAmount;

    // Calculate profit summary
    const totalCost = marginByItem.reduce((sum, item) => sum + item.cost, 0);
    const totalProfit = grandTotal - totalCost;
    const profitPercentage =
      totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const profitSummary = {
      totalCost,
      totalProfit,
      profitPercentage,
      marginByItem,
    };

    // Set expiration date (30 days from now if not provided)
    const expiresAt = validUntil
      ? new Date(validUntil)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Generate quotation number manually as fallback
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-3);
    const quotationNumber = `QT-${year}-${month}${day}-${timestamp}`;

    const quotation = new Quotation({
      quotationNumber,
      client,
      clientContact,
      items,
      subtotal,
      discount: discountAmount,
      discountType,
      transportationCost,
      taxRate,
      taxAmount,
      grandTotal,
      validUntil: expiresAt,
      expiresAt,
      deliveryTerms,
      paymentTerms,
      warranty,
      termsAndInstructions,
      notes,
      profitSummary,
      createdBy,
    });

    await quotation.save();

    // Populate the created quotation
    await quotation.populate("client", "companyName contacts");
    await quotation.populate("items.product", "name brand modelName");
    await quotation.populate("items.selectedVendor", "companyName");

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: "Failed to create quotation" },
      { status: 500 }
    );
  }
}
