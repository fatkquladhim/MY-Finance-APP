import OpenAI from 'openai';
import { buildFinancialContext } from './context-builder';
import { getBaseSystemPrompt } from './prompts';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
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
  
  const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  const openai = getOpenAIClient();
  
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    max_tokens: 1500,
    temperature: 0.7,
    presence_penalty: 0.1,
    frequency_penalty: 0.1
  });
  
  return {
    content: response.choices[0]?.message?.content || 'Maaf, saya tidak dapat memberikan respons saat ini.',
    tokensUsed: response.usage?.total_tokens || 0,
    model
  };
}

export async function generateConversationTitle(
  firstMessage: string
): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate a short, concise title (max 5 words) for a conversation that starts with this message. Respond only with the title, no quotes or punctuation.'
        },
        {
          role: 'user',
          content: firstMessage.substring(0, 200)
        }
      ],
      max_tokens: 20,
      temperature: 0.5
    });
    
    return response.choices[0]?.message?.content?.trim() || 'New Conversation';
  } catch {
    return 'New Conversation';
  }
}
