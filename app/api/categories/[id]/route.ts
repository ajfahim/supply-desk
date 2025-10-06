import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Category } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(params.id)
      .populate('parentCategory', 'name');
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
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
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate that parent category exists if provided
    if (body.parentCategory && !mongoose.Types.ObjectId.isValid(body.parentCategory)) {
      return NextResponse.json(
        { error: 'Invalid parent category ID' },
        { status: 400 }
      );
    }

    // Prevent circular reference
    if (body.parentCategory === params.id) {
      return NextResponse.json(
        { error: 'Category cannot be its own parent' },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name');
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
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
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category has products
    const { Product } = await import('@/lib/models');
    const productsCount = await Product.countDocuments({ category: params.id });
    
    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It has ${productsCount} products assigned to it.` },
        { status: 400 }
      );
    }

    // Check if category has child categories
    const childCategoriesCount = await Category.countDocuments({ parentCategory: params.id });
    
    if (childCategoriesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It has ${childCategoriesCount} child categories.` },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(params.id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
