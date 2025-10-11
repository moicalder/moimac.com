import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Add background_color column to users table
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT 'white';
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Background color column added successfully' 
    })
  } catch (error) {
    console.error('Error adding background_color column:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add background_color column' },
      { status: 500 }
    )
  }
}

