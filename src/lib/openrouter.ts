import { OpenRouter } from '@openrouter/sdk';
import { buildFinancialContext } from './context-builder';
import { getBaseSystemPrompt } from './prompts';

// Lazy initialization of OpenRouter client
let openRouterClient: OpenRouter | null = null;

function getOpenRouterClient(): OpenRouter {
  if (!openRouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    openRouterClient = new OpenRouter({
      apiKey,
      httpReferer: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      xTitle: process.env.OPENROUTER_APP_NAME || 'My Finance App',
    });
  }
  return openRouterClient;
}

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatCompletionMessage[];
  userId: string;
  includeFinancialContext?: boolean;
}

export interface ChatCompletionResult {
  content: string;
  tokensUsed: number;
  model: string;
}

export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const { messages, userId, includeFinancialContext = true } = options;

  let systemPrompt = getBaseSystemPrompt();

  if (includeFinancialContext) {
    try {
      const financialContext = await buildFinancialContext(userId);
      systemPrompt += '\n\n' + financialContext;
    } catch (error) {
      console.error('Failed to build financial context:', error);
      // Continue without financial context
    }
  }

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const openRouter = getOpenRouterClient();

  const completion = await openRouter.chat.send({
    httpReferer: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
    xTitle: process.env.OPENROUTER_APP_NAME || 'My Finance App',
    chatGenerationParams: {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
      maxTokens: 1500,
      temperature: 0.7,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1,
    },
  });

  const messageContent = completion.choices[0]?.message?.content;
  const content = typeof messageContent === 'string' ? messageContent : 'Maaf, saya tidak dapat memberikan respons saat ini.';

  return {
    content,
    tokensUsed: completion.usage?.totalTokens || 0,
    model,
  };
}

export async function generateConversationTitle(
  firstMessage: string
): Promise<string> {
  try {
    const openRouter = getOpenRouterClient();
    const completion = await openRouter.chat.send({
      httpReferer: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      xTitle: process.env.OPENROUTER_APP_NAME || 'My Finance App',
      chatGenerationParams: {
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, concise title (max 5 words) for a conversation that starts with this message. Respond only with the title, no quotes or punctuation.',
          },
          {
            role: 'user',
            content: firstMessage.substring(0, 200),
          },
        ],
        stream: false,
        maxTokens: 20,
        temperature: 0.5,
      },
    });

    const messageContent = completion.choices[0]?.message?.content;
    const title = typeof messageContent === 'string' ? messageContent.trim() : 'New Conversation';
    return title || 'New Conversation';
  } catch {
    return 'New Conversation';
  }
}
