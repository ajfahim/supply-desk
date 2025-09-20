import { Invoice } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const invoice = await Invoice.findById(params.id)
      .populate("client", "companyName contacts address")
      .populate("quotation", "quotationNumber")
      .populate("items.product", "name brand modelName specifications")
      .populate({
        path: "clientContact",
        select: "name title email phone department",
      });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { status, paidDate, paidAmount, ...updateData } = body;

    const updateFields: any = { ...updateData };

    // Handle payment status updates
    if (status === "paid" && paidDate && paidAmount) {
      updateFields.status = "paid";
      updateFields.paidDate = new Date(paidDate);
      updateFields.paidAmount = paidAmount;
    } else if (status) {
      updateFields.status = status;
    }

    const invoice = await Invoice.findByIdAndUpdate(
      params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate("client", "companyName contacts address")
      .populate("quotation", "quotationNumber")
      .populate("items.product", "name brand modelName specifications")
      .populate({
        path: "clientContact",
        select: "name title email phone department",
      });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const invoice = await Invoice.findByIdAndDelete(params.id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
