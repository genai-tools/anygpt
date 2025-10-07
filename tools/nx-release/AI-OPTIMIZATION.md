# AI Summary Optimization

## Problem
The nx-release PR summary generation was sending too much data to the AI:
- No model specified (could use expensive models)
- Large diffs sent entirely (could be thousands of lines)
- Large files dominated the context, hiding changes in other files
- No token limits on responses

## Solution Implemented

### 1. Model Selection
- **Added `aiModel` parameter** (default: `fast`)
- **Added `maxTokens` parameter** (default: 500)
- Commands now include `--model fast --max-tokens 500` by default
- Users can override for better quality if needed

### 2. Smart Per-File Diff Truncation
Created `diff-truncation.ts` with intelligent truncation:
- **Truncates per-file** instead of globally
- Keeps first 80% and last 20% of each large file
- Prevents one large file from dominating the context
- **Default: 100 lines per file** (configurable via `maxLinesPerFile`)
- Provides stats on truncation (files truncated, lines saved)

### 3. Benefits
- **Cost Reduction**: Uses fast/cheap models by default
- **Better Context**: All files represented, not just the first few
- **Faster**: Smaller prompts = faster responses
- **Configurable**: Can adjust all parameters if needed

## Usage

### Default Behavior
```bash
npm run release
```
Uses: `fast` model, 1000 max tokens, 150 lines per file

### Configuration
Configured centrally in `nx.json`:
```json
{
  "targetDefaults": {
    "release": {
      "executor": "./tools/nx-release:release",
      "options": {
        "aiCommand": "npx anygpt chat --stdin --model fast --max-tokens 1000",
        "maxLinesPerFile": 150
      }
    }
  }
}
```

### Adjusting Settings
Edit the values in `nx.json` to tune for your needs:

**More detailed summaries:**
```json
"aiCommand": "npx anygpt chat --stdin --model fast --max-tokens 2000"
```

**Better quality (slower/more expensive):**
```json
"aiCommand": "npx anygpt chat --stdin --model gpt-4o --max-tokens 1000"
```

**Larger files:**
```json
"maxLinesPerFile": 200
```

### Using Alternative AI Providers
The executor is **completely provider-agnostic**. It only knows:
1. Execute the command
2. Pipe the prompt via stdin
3. Read the response from stdout

This means you can use **any** CLI tool:

```json
{
  "targetDefaults": {
    "release": {
      "options": {
        // Simon Willison's llm CLI
        "aiCommand": "llm --model gpt-4o-mini",
        
        // aichat
        "aiCommand": "aichat --model gpt-4o-mini",
        
        // Local Ollama
        "aiCommand": "ollama run llama3.2",
        
        // Claude CLI (if it supports stdin)
        "aiCommand": "claude --model claude-3-haiku-20240307",
        
        // Default: anygpt CLI
        "aiCommand": "npx anygpt chat --stdin --model fast --max-tokens 1000"
      }
    }
  }
}
```

The executor is **completely unaware** of AI providers - it just runs the command and pipes data.

## Technical Details

### Parameters

#### `aiCommand` (string, default: "npx anygpt chat --stdin --model fast --max-tokens 1000")
The complete command to execute for AI summary generation. 
- Must accept prompt via stdin
- Must output response to stdout
- Can be any CLI tool (llm, aichat, ollama, etc.)

#### `maxLinesPerFile` (number, default: 150)
Maximum lines per file in the diff sent to AI.
- Files larger than this are truncated
- Keeps beginning (80%) and end (20%) for context
- Prevents large files from dominating

### Truncation Algorithm

```
For each file in diff:
  if file_lines > maxLinesPerFile:
    keep first 80% of limit
    add "... [truncated N lines] ..."
    keep last 20% of limit
  else:
    keep entire file
```

### Example Output
```
📊 Diff stats: 5 files, 2 truncated, 1247 → 487 lines (-61%)
```

## Files Changed

### New Files
- `tools/nx-release/src/lib/diff-truncation.ts` - Smart truncation logic

### Modified Files
- `tools/nx-release/src/lib/ai-summary.ts` - Accept new parameters, use truncation
- `tools/nx-release/src/executors/release/executor.ts` - Pass parameters
- `tools/nx-release/src/executors/pr-update/executor.ts` - Pass parameters
- `tools/nx-release/src/executors/*/schema.json` - Add new parameters
- `tools/nx-release/src/executors/*/schema.d.ts` - TypeScript definitions

## Cost Impact

### Before
- Model: Unknown (could be gpt-4, opus, etc.)
- Input: Full diff (could be 5000+ lines)
- Output: Unlimited

### After
- Model: `fast` (gpt-4o-mini or similar)
- Input: Truncated diff (~750 lines typical with 5 files)
- Output: Limited to 1000 tokens

**Estimated savings: 70-85% reduction in AI costs**
