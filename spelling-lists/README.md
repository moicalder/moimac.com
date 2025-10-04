# Custom Word Lists for TypeMaster

Add your own custom word lists here! Perfect for:
- 📝 Spelling bee practice
- 📚 Vocabulary building
- 🎓 Educational word lists
- 🗣️ Language learning

## How to Add Word Lists

Edit the single `spelling-lists.json` file in this folder:

```json
{
  "lists": [
    {
      "id": "week-oct-5",
      "name": "Spelling Words - Week of Oct 5th",
      "words": [
        "acknowledge",
        "rhythm",
        "necessary",
        "separate",
        "definitely"
      ]
    },
    {
      "id": "my-custom-list",
      "name": "My Custom Words",
      "words": [
        "word1",
        "word2",
        "word3"
      ]
    }
  ]
}
```

## Format

- **`id`**: Unique identifier (use lowercase-with-dashes)
- **`name`**: Display name shown in TypeMaster
- **`words`**: Array of words to practice

## Features

- ✅ **Central File**: All lists in one easy-to-edit JSON
- 🔀 **Randomized**: Words are shuffled each time for variety
- 📊 **Tracked**: Results are saved to your leaderboard
- 🔊 **Text-to-Speech**: Enable voice pronunciation for spelling practice
- ♾️ **All Words**: Practice goes through every word in the list

## Tips

- Keep words lowercase for easier typing
- Great for kids' spelling homework!
- Add new lists by adding objects to the `lists` array
- Create themed word collections
- Use for typing speed improvement with common words

Happy typing! ⌨️

