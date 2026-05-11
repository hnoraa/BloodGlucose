import { NextRequest, NextResponse } from 'next/server';
import { getRecordById, deleteRecord, updateRecord } from '@/lib/db';
import { CreateRecordRequest } from '@/types';

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
 * PUT /api/records/:id
 * Update a glucose record
 */
export async function PUT(
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

    const body = (await request.json()) as CreateRecordRequest;

    if (!body.date || !body.dosage || !body.drawData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: date, dosage, drawData',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.drawData) || body.drawData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'drawData must be a non-empty array',
        },
        { status: 400 }
      );
    }

    for (const reading of body.drawData) {
      if (!reading.time || typeof reading.reading !== 'number') {
        return NextResponse.json(
          {
            success: false,
            error: 'Each reading must have a time and a numeric reading value',
          },
          { status: 400 }
        );
      }
    }

    const updatedRecord = updateRecord(recordId, {
      date: body.date,
      dosage: body.dosage,
      first_dose_time: body.first_dose_time,
      second_dose_time: body.second_dose_time,
      drawData: body.drawData,
    });

    if (!updatedRecord) {
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
        data: updatedRecord,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/records/:id error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A record for this date already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update record',
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
