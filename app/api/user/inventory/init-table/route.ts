import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create user_inventory table
    await sql`
      CREATE TABLE IF NOT EXISTS user_inventory (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        bitmap_string TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('character', 'vehicle')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `

    // Create index on user_id for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id 
      ON user_inventory(user_id);
    `

    return NextResponse.json({ 
      success: true,
      message: 'user_inventory table created successfully'
    })
  } catch (error) {
    console.error('Error creating user_inventory table:', error)
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    )
  }
}

