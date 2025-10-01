import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db'

/**
 * Initialize database tables
 * Call this once after setting up Vercel Postgres
 * DELETE THIS FILE after running it once for security
 */
export async function GET() {
  try {
    const result = await initializeDatabase()
    
    if (result.success) {
      return NextResponse.json({ 
        message: 'Database initialized successfully',
        note: 'Please delete this API route file for security'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize database', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

