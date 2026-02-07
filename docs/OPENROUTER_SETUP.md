# OpenRouter Configuration Guide

This document explains how OpenRouter has been configured for the My Finance App.

## Overview

OpenRouter is now integrated as the AI provider for the chat functionality, replacing the direct OpenAI integration. This allows you to use various AI models through a single API.

## Files Modified/Created

### 1. Created: `src/lib/openrouter.ts`
This is the main OpenRouter configuration file that provides:
- `createChatCompletion()` - Main function for generating AI responses
- `generateConversationTitle()` - Function for generating conversation titles
- Lazy initialization of the OpenRouter client
- Support for financial context integration

### 2. Modified: `src/app/api/chat/route.ts`
Updated to import from `@/lib/openrouter` instead of `@/lib/openai`.

### 3. Updated: `.env.example`
Added/updated OpenRouter environment variables with better documentation.

## Environment Variables

Add these to your `.env` file:

```env
# OpenRouter API Key (get from https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx

# Your site URL (for OpenRouter rankings)
OPENROUTER_SITE_URL=http://localhost:3000

# Your app name (for OpenRouter rankings)
OPENROUTER_APP_NAME=My Finance App

# AI Model to use
# Free models: arcee-ai/trinity-large-preview:free, google/gemma-7b-it:free
# Paid models: openai/gpt-4o-mini, openai/gpt-4o, anthropic/claude-3-haiku
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## Getting Your OpenRouter API Key

1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [https://openrouter.ai/keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key and add it to your `.env` file

## Available Models

OpenRouter provides access to many AI models. Here are some popular options:

### Free Models
- `arcee-ai/trinity-large-preview:free` - Free model
- `google/gemma-7b-it:free` - Google's Gemma 7B (free)

### Paid Models (Recommended)
- `openai/gpt-4o-mini` - OpenAI GPT-4o Mini (cost-effective)
- `openai/gpt-4o` - OpenAI GPT-4o (more capable)
- `anthropic/claude-3-haiku` - Anthropic Claude 3 Haiku
- `anthropic/claude-3-sonnet` - Anthropic Claude 3 Sonnet

For a complete list of available models, visit: https://openrouter.ai/models

## Configuration Details

### OpenRouter Client Initialization

The OpenRouter client is initialized with:
- API key from environment variable
- `httpReferer` parameter (for OpenRouter rankings)
- `xTitle` parameter (for OpenRouter rankings)

### Chat Completion Parameters

The `createChatCompletion()` function uses these parameters:
- `model`: From `OPENROUTER_MODEL` environment variable
- `maxTokens`: 1500
- `temperature`: 0.7
- `presencePenalty`: 0.1
- `frequencyPenalty`: 0.1
- `stream`: false (non-streaming)

**Note**: The OpenRouter SDK uses camelCase parameter names (e.g., `maxTokens`, `presencePenalty`) instead of snake_case.

### Financial Context Integration

The OpenRouter integration maintains the financial context feature:
- User's financial data is automatically included in system prompts
- Includes income, expenses, budgets, goals, and portfolio information
- Helps the AI provide personalized financial advice

## Usage Example

```typescript
import { createChatCompletion } from '@/lib/openrouter';

const result = await createChatCompletion({
  messages: [
    { role: 'user', content: 'How can I save more money?' }
  ],
  userId: 'user123',
  includeFinancialContext: true
});

console.log(result.content); // AI response
console.log(result.tokensUsed); // Token usage
console.log(result.model); // Model used
```

## Testing the Integration

1. Ensure your `.env` file has the correct `OPENROUTER_API_KEY`
2. Start the development server: `npm run dev`
3. Navigate to the chat page in your app
4. Send a message to test the AI response

## Troubleshooting

### Error: "OPENROUTER_API_KEY environment variable is not set"
- Make sure you've added `OPENROUTER_API_KEY` to your `.env` file
- Restart the development server after adding the variable

### Error: "AI service configuration error"
- Verify your API key is correct
- Check if you have credits in your OpenRouter account
- Ensure the model you're using is available

### Slow Responses
- Try using a faster model like `openai/gpt-4o-mini`
- Check your internet connection
- Consider reducing `max_tokens` in the configuration

## Cost Considerations

- Free models are available but may have limitations
- Paid models charge per token (input + output)
- Monitor your usage at [https://openrouter.ai/activity](https://openrouter.ai/activity)
- Set up billing alerts in your OpenRouter account

## Switching Back to OpenAI

If you need to switch back to the original OpenAI implementation:

1. Restore the import in `src/app/api/chat/route.ts`:
   ```typescript
   import { createChatCompletion, generateConversationTitle } from '@/lib/openai';
   ```

2. Ensure `OPENAI_API_KEY` is set in your `.env` file

## Additional Resources

- OpenRouter Documentation: https://openrouter.ai/docs
- OpenRouter Models: https://openrouter.ai/models
- OpenRouter Pricing: https://openrouter.ai/pricing
- @openrouter/sdk GitHub: https://github.com/openrouter/openrouter-typescript-sdk
