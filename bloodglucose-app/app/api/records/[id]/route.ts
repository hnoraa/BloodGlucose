import { NextRequest, NextResponse } from 'next/server';
import { getRecordById, deleteRecord } from '@/lib/db';

/**
 * GET /api/records/:id
 * Returns a specific glucose record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);
    
    if (isNaN(recordId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid record ID',
        },
        { status: 400 }
      );
    }

    const record = getRecordById(recordId);
    
    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'Record not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('GET /api/records/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch record',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/records/:id
 * Delete a glucose record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);
    
    if (isNaN(recordId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid record ID',
        },
        { status: 400 }
      );
    }

    const deleted = deleteRecord(recordId);
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Record not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: recordId },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/records/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete record',
      },
      { status: 500 }
    );
  }
}
