# Scripts

Useful scripts for managing the MoiMac project.

## Spelling List Manager

A comprehensive tool for managing spelling lists in TypeMaster.

### Usage

```bash
# Interactive mode (no arguments)
node scripts/add-spelling-list.js

# Import from file
node scripts/add-spelling-list.js <words-file>
```

### Interactive Mode

Run without arguments for full management interface:

```
🎯 Spelling List Manager
=======================

📚 Found 3 spelling list(s):
  1. Spelling Bee - Week 1 (10 words)
  2. Vocabulary List (15 words)
  3. Common Words (25 words)

What would you like to do? (v)iew, (d)elete, (a)dd, (q)uit:
```

### Commands

#### View Lists
- `v` or `view` - Show all words in a specific list
- `a` or `add` - Create a new list interactively
- `d` or `delete` - Delete an existing list
- `q` or `quit` - Exit the manager

#### File Import Mode

When you provide a file path, it imports words from that file:

```bash
# Comma-separated
echo "apple, banana, cherry" > words.txt
node scripts/add-spelling-list.js words.txt

# Line-separated
cat > words.txt << 'EOF'
accommodate
rhythm
necessary
EOF
node scripts/add-spelling-list.js words.txt
```

### Interactive Add Mode

When adding a new list interactively:

```
🏷️  Enter list name: My Spelling Words

📝 Adding words to "My Spelling Words". Type each word and press Enter.
   Press Enter twice (empty line) when finished.

Word 1: accommodate
Word 2: rhythm
Word 3: necessary

Word 4: [empty line - finishes]

✅ Created new list: "My Spelling Words"
🎉 Successfully added 3 words to "My Spelling Words"
```

### File Format Support

The script intelligently parses different formats:

- **Comma-separated:** `word1, word2, word3`
- **Line-separated:** One word per line
- **Space-separated:** `word1 word2 word3`
- **Mixed formats:** Automatically detects the best parsing method

### Features

- ✅ **Smart parsing** - handles multiple file formats
- ✅ **Interactive management** - view, delete, add lists
- ✅ **Duplicate handling** - updates existing lists or creates new ones
- ✅ **ID generation** - creates unique IDs from list names
- ✅ **Validation** - ensures list names and words are valid
- ✅ **Error handling** - graceful error messages and recovery

### Tips

- Perfect for kids' spelling homework!
- Great for weekly vocabulary lists
- Use for language learning word collections
- Import from school worksheets or online lists
