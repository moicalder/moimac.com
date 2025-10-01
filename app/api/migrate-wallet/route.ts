import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

/**
 * Add wallet_address column to existing users table
 * Run this once if you already initialized the database before adding wallet support
 * DELETE THIS FILE after running it once
 */
export async function GET() {
  try {
    // Add wallet_address column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255);
    `
    
    return NextResponse.json({ 
      message: 'Wallet column added successfully',
      note: 'Please delete this API route file for security'
    })
  } catch (error) {
    console.error('Error migrating database:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    )
  }
}

