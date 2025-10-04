# Scripts

Useful scripts for managing the MoiMac project.

## add-spelling-list.js

Adds a new word list to the TypeMaster spelling lists from a text file.

### Usage

```bash
node scripts/add-spelling-list.js <words-file>
```

### Examples

#### Comma-separated words:
```bash
echo "apple, banana, cherry, date" > my-words.txt
node scripts/add-spelling-list.js my-words.txt
```

#### Line-separated words:
```bash
cat > my-words.txt << 'EOF'
accommodate
rhythm
necessary
separate
definitely
EOF
node scripts/add-spelling-list.js my-words.txt
```

### How it works:

1. **Reads the file** and parses words intelligently
2. **Handles multiple formats:**
   - Comma-separated: `word1, word2, word3`
   - Line-separated: one word per line
   - Space-separated: `word1 word2 word3`
3. **Asks for list name** interactively
4. **Generates unique ID** from the name
5. **Updates** `spelling-lists/spelling-lists.json`
6. **Handles duplicates** by updating existing lists

### Output Example:

```
📝 Found 10 words in my-words.txt:
accommodate, rhythm, necessary, separate...

🏷️  Enter list name: Spelling Bee Words

✅ Created new list: "Spelling Bee Words"
🎉 Successfully added 10 words to "Spelling Bee Words"
📁 Updated: spelling-lists/spelling-lists.json
```

### Tips:

- Words are automatically trimmed and filtered (empty words removed)
- List names can contain spaces and special characters
- IDs are generated automatically (lowercase, hyphens instead of spaces)
- Existing lists with the same generated ID will be updated
- Perfect for adding kids' spelling homework or vocabulary lists!
