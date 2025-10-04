#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const SPELLING_LISTS_PATH = path.join(__dirname, '..', 'spelling-lists', 'spelling-lists.json');
const WORDS_FILE = process.argv[2];

if (!WORDS_FILE) {
  console.error('❌ Usage: node add-spelling-list.js <words-file>');
  console.error('Example: node add-spelling-list.js my-words.txt');
  process.exit(1);
}

if (!fs.existsSync(WORDS_FILE)) {
  console.error(`❌ File not found: ${WORDS_FILE}`);
  process.exit(1);
}

// Read the words file
const wordsContent = fs.readFileSync(WORDS_FILE, 'utf-8').trim();

// Parse words intelligently
let words = [];

if (wordsContent.includes(',')) {
  // Comma-separated
  words = wordsContent.split(',')
    .map(word => word.trim())
    .filter(word => word.length > 0);
} else {
  // Line or space separated (remove empty lines and trim)
  words = wordsContent.split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length > 0);
}

if (words.length === 0) {
  console.error('❌ No words found in file');
  process.exit(1);
}

console.log(`📝 Found ${words.length} words in ${WORDS_FILE}:`);
console.log(words.slice(0, 10).join(', ') + (words.length > 10 ? '...' : ''));

// Ask for list name
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🏷️  Enter list name: ', (listName) => {
  if (!listName.trim()) {
    console.error('❌ List name cannot be empty');
    rl.close();
    process.exit(1);
  }

  // Read existing spelling lists
  let spellingLists = { lists: [] };

  if (fs.existsSync(SPELLING_LISTS_PATH)) {
    try {
      const existingContent = fs.readFileSync(SPELLING_LISTS_PATH, 'utf-8');
      spellingLists = JSON.parse(existingContent);
    } catch (error) {
      console.error('❌ Error reading existing spelling lists:', error.message);
      rl.close();
      process.exit(1);
    }
  }

  // Generate unique ID
  const listId = listName.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if ID already exists
  const existingList = spellingLists.lists.find(list => list.id === listId);
  if (existingList) {
    console.log(`⚠️  List "${listName}" already exists. Updating with new words...`);
    existingList.words = words;
    existingList.name = listName;
  } else {
    // Add new list
    spellingLists.lists.push({
      id: listId,
      name: listName,
      words: words
    });
    console.log(`✅ Created new list: "${listName}"`);
  }

  // Write back to file
  try {
    fs.writeFileSync(SPELLING_LISTS_PATH, JSON.stringify(spellingLists, null, 2));
    console.log(`🎉 Successfully added ${words.length} words to "${listName}"`);
    console.log(`📁 Updated: ${SPELLING_LISTS_PATH}`);
  } catch (error) {
    console.error('❌ Error writing spelling lists file:', error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
});

