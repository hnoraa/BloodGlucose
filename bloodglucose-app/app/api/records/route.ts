import { NextRequest, NextResponse } from 'next/server';
import { getAllRecords, createRecord } from '@/lib/db';
import { CreateRecordRequest } from '@/types';

/**
 * GET /api/records
 * Returns all glucose records sorted by date descending
 */
export async function GET() {
  try {
    const records = getAllRecords();
    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('GET /api/records error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch records',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/records
 * Create a new glucose record
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateRecordRequest;

    // Validate required fields
    if (!body.date || !body.dosage || !body.drawData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: date, dosage, drawData',
        },
        { status: 400 }
      );
    }

    // Validate drawData is an array
    if (!Array.isArray(body.drawData) || body.drawData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'drawData must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Validate each reading in drawData
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

    const record = createRecord({
      date: body.date,
      dosage: body.dosage,
      first_dose_time: body.first_dose_time,
      second_dose_time: body.second_dose_time,
      drawData: body.drawData,
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/records error:', error);
    
    // Handle duplicate date error
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
        error: 'Failed to create record',
      },
      { status: 500 }
    );
  }
}
