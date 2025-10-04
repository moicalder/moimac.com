import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

interface SpellingList {
  id: string
  name: string
  words: string[]
}

/**
 * Get all available spelling lists from spelling-lists.json
 * GET /api/spelling-lists
 */
export async function GET() {
  try {
    const spellingListsPath = join(process.cwd(), 'spelling-lists', 'spelling-lists.json')
    
    // Read the central JSON file
    let fileContents: string
    try {
      fileContents = readFileSync(spellingListsPath, 'utf-8')
    } catch {
      // File doesn't exist, return empty array
      return NextResponse.json({ lists: [] })
    }
    
    // Parse the JSON
    const data = JSON.parse(fileContents)
    const lists: SpellingList[] = data.lists || []
    
    return NextResponse.json({ lists })
  } catch (error) {
    console.error('Error reading spelling lists:', error)
    return NextResponse.json({ lists: [] })
  }
}

