#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const SPELLING_LISTS_PATH = path.join(__dirname, '..', 'spelling-lists', 'spelling-lists.json');

async function main() {
  console.log('🎯 Spelling List Manager');
  console.log('=======================\n');

  // Read existing spelling lists
  let spellingLists = { lists: [] };

  if (fs.existsSync(SPELLING_LISTS_PATH)) {
    try {
      const existingContent = fs.readFileSync(SPELLING_LISTS_PATH, 'utf-8');
      spellingLists = JSON.parse(existingContent);
    } catch (error) {
      console.error('❌ Error reading existing spelling lists:', error.message);
      process.exit(1);
    }
  }

  const lists = spellingLists.lists;

  if (lists.length === 0) {
    console.log('📚 No spelling lists found.');
  } else {
    console.log(`📚 Found ${lists.length} spelling list(s):`);
    lists.forEach((list, index) => {
      console.log(`  ${index + 1}. ${list.name} (${list.words.length} words)`);
    });
    console.log('');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  try {
    const action = await askQuestion('What would you like to do? (v)iew, (d)elete, (a)dd, (q)uit: ');

    switch (action.toLowerCase()) {
      case 'v':
      case 'view': {
        if (lists.length === 0) {
          console.log('📚 No lists to view.');
          break;
        }

        const listNum = await askQuestion('Enter list number to view: ');
        const index = parseInt(listNum) - 1;

        if (index < 0 || index >= lists.length) {
          console.log('❌ Invalid list number.');
          break;
        }

        const list = lists[index];
        console.log(`\n📋 ${list.name}:`);
        list.words.forEach((word, i) => {
          console.log(`  ${i + 1}. ${word}`);
        });
        console.log('');
        break;
      }

      case 'd':
      case 'delete': {
        if (lists.length === 0) {
          console.log('📚 No lists to delete.');
          break;
        }

        const listNum = await askQuestion('Enter list number to delete: ');
        const index = parseInt(listNum) - 1;

        if (index < 0 || index >= lists.length) {
          console.log('❌ Invalid list number.');
          break;
        }

        const list = lists[index];
        const confirm = await askQuestion(`Delete "${list.name}"? (y/n): `);

        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          lists.splice(index, 1);
          fs.writeFileSync(SPELLING_LISTS_PATH, JSON.stringify(spellingLists, null, 2));
          console.log(`✅ Deleted "${list.name}"`);
        } else {
          console.log('❌ Delete cancelled.');
        }
        break;
      }

      case 'a':
      case 'add': {
        const listName = await askQuestion('🏷️  Enter list name: ');

        if (!listName.trim()) {
          console.log('❌ List name cannot be empty.');
          break;
        }

        console.log(`📝 Adding words to "${listName}". Type each word and press Enter.`);
        console.log('   Press Enter twice (empty line) when finished.\n');

        const words = [];
        let wordCount = 0;

        while (true) {
          const word = await askQuestion(`Word ${wordCount + 1}: `);

          if (word.trim() === '') {
            if (words.length === 0) {
              console.log('❌ At least one word required.');
              break;
            }
            break;
          }

          words.push(word.trim());
          wordCount++;
        }

        if (words.length > 0) {
          // Generate unique ID
          const listId = listName.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          // Check if ID already exists
          const existingList = lists.find(list => list.id === listId);
          if (existingList) {
            console.log(`⚠️  List "${listName}" already exists. Updating with new words...`);
            existingList.words = words;
            existingList.name = listName;
          } else {
            // Add new list
            lists.push({
              id: listId,
              name: listName,
              words: words
            });
            console.log(`✅ Created new list: "${listName}"`);
          }

          // Write back to file
          fs.writeFileSync(SPELLING_LISTS_PATH, JSON.stringify(spellingLists, null, 2));
          console.log(`🎉 Successfully added ${words.length} words to "${listName}"`);
        }
        break;
      }

      case 'q':
      case 'quit':
      case 'exit':
        console.log('👋 Goodbye!');
        break;

      default:
        console.log('❌ Invalid option. Use (v)iew, (d)elete, (a)dd, or (q)uit.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
}

// Handle command line arguments for direct file import
const WORDS_FILE = process.argv[2];
if (WORDS_FILE) {
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

  // Read existing spelling lists and add the words
  let spellingLists = { lists: [] };

  if (fs.existsSync(SPELLING_LISTS_PATH)) {
    try {
      const existingContent = fs.readFileSync(SPELLING_LISTS_PATH, 'utf-8');
      spellingLists = JSON.parse(existingContent);
    } catch (error) {
      console.error('❌ Error reading existing spelling lists:', error.message);
      process.exit(1);
    }
  }

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
    }

    rl.close();
  });
} else {
  // Interactive mode
  main();
}

