import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Add digits columns to mathmode_sessions table
 * Run this once, then DELETE THIS FILE
 */
export async function GET() {
  try {
    // Add digits1 and digits2 columns
    await sql`
      ALTER TABLE mathmode_sessions 
      ADD COLUMN IF NOT EXISTS digits1 INTEGER,
      ADD COLUMN IF NOT EXISTS digits2 INTEGER;
    `

    return NextResponse.json({ 
      message: 'Digits columns added successfully',
      note: 'DELETE /app/api/mathmode/add-digits-column/route.ts for security'
    })
  } catch (error) {
    console.error('Error adding digits columns:', error)
    return NextResponse.json(
      { error: 'Failed to add columns', details: String(error) },
      { status: 500 }
    )
  }
}

