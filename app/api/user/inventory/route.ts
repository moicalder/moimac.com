import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch user's inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const result = await sql`
      SELECT id, bitmap_string, type, created_at
      FROM user_inventory
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `

    return NextResponse.json({ items: result.rows })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST - Add new item to inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, bitmapString, type } = body

    if (!userId || !bitmapString || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type !== 'character' && type !== 'vehicle') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "character" or "vehicle"' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO user_inventory (user_id, bitmap_string, type)
      VALUES (${userId}, ${bitmapString}, ${type})
      RETURNING id, bitmap_string, type, created_at;
    `

    return NextResponse.json({ 
      success: true,
      item: result.rows[0]
    })
  } catch (error) {
    console.error('Error adding to inventory:', error)
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from inventory
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, itemId } = body

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the item belongs to the user before deleting
    const result = await sql`
      DELETE FROM user_inventory
      WHERE id = ${itemId} AND user_id = ${userId}
      RETURNING id;
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}

