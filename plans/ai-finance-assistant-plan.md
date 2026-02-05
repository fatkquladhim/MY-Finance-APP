# AI-Powered Personal Finance Assistant - Implementation Plan

## Executive Summary

This plan outlines the incremental implementation of AI-powered features for the MY-Finance-APP, building on the existing Next.js + MongoDB stack. The primary focus is implementing a GPT-4 powered Financial Chatbot with full access to user financial data, followed by expenditure prediction, anomaly detection, and investment optimization features.

---

## 1. Current State Analysis

### 1.1 Existing Tech Stack
| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MongoDB with Mongoose |
| Authentication | NextAuth.js (JWT strategy) |
| Charts | Chart.js + react-chartjs-2 |

### 1.2 Existing Features
- User authentication (credentials-based login/register)
- Finance management (income/expense CRUD operations)
- Portfolio tracking (stocks, crypto, funds, property)
- Dashboard with visualizations
- Monthly reports (placeholder)
- CSV export functionality

### 1.3 Existing Data Models

```typescript
// Finance Model
{
  userId: String,
  type: 'income' | 'expense',
  amount: Number,
  category: String,
  description: String,
  date: Date
}

// Portfolio Model
{
  userId: String,
  asset: String,
  type: 'stock' | 'crypto' | 'fund' | 'property',
  quantity: Number,
  currentValue: Number,
  purchasePrice: Number,
  timestamps: true
}

// User Model
{
  name: String,
  email: String,
  password: String (hashed),
  bio: String,
  avatar: String,
  timestamps: true
}
```

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|  Next.js Client  |<--->|  Next.js API      |<--->|    MongoDB       |
|  (React + TS)    |     |  Routes           |     |    Database      |
|                  |     |                   |     |                  |
+------------------+     +--------+----------+     +------------------+
                                  |
                                  v
                         +--------+----------+
                         |                   |
                         |   OpenAI GPT-4    |
                         |   API Service     |
                         |                   |
                         +-------------------+
```

### 2.2 AI Chatbot Architecture

```
+------------------------------------------------------------------+
|                        CHATBOT SYSTEM                             |
+------------------------------------------------------------------+
|                                                                   |
|  +---------------+    +------------------+    +-----------------+ |
|  |               |    |                  |    |                 | |
|  |  Chat UI      |--->| Chat API Route   |--->| Context Builder | |
|  |  Component    |    | /api/chat        |    | Service         | |
|  |               |    |                  |    |                 | |
|  +---------------+    +--------+---------+    +--------+--------+ |
|                                |                       |          |
|                                v                       v          |
|                       +--------+---------+    +--------+--------+ |
|                       |                  |    |                 | |
|                       | Conversation     |    | Financial Data  | |
|                       | History Store    |    | Aggregator      | |
|                       |                  |    |                 | |
|                       +------------------+    +-----------------+ |
|                                                        |          |
|                                                        v          |
|                                               +--------+--------+ |
|                                               |                 | |
|                                               | OpenAI GPT-4    | |
|                                               | API Integration | |
|                                               |                 | |
|                                               +-----------------+ |
+------------------------------------------------------------------+
```

---

## 3. Database Schema Evolution

### 3.1 New Collections Required

#### ChatConversation Collection
```typescript
// models/ChatConversation.ts
const ChatConversationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      tokensUsed: Number,
      model: String,
      financeContext: Boolean
    }
  }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });
```

#### UserPreferences Collection (for AI settings)
```typescript
// models/UserPreferences.ts
const UserPreferencesSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  chatSettings: {
    enableFinancialContext: { type: Boolean, default: true },
    preferredLanguage: { type: String, default: 'id' },
    responseStyle: { type: String, enum: ['concise', 'detailed', 'educational'], default: 'detailed' }
  },
  notificationSettings: {
    anomalyAlerts: { type: Boolean, default: true },
    budgetReminders: { type: Boolean, default: true },
    weeklyInsights: { type: Boolean, default: false }
  },
  privacySettings: {
    shareDataWithAI: { type: Boolean, default: true },
    retainChatHistory: { type: Boolean, default: true }
  }
}, { timestamps: true });
```

#### Budget Collection (for chatbot budget advice)
```typescript
// models/Budget.ts
const BudgetSchema = new Schema({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  monthlyLimit: { type: Number, required: true },
  period: { 
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true }
  },
  alertThreshold: { type: Number, default: 80 }, // percentage
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

#### SavingGoal Collection (for chatbot goal tracking)
```typescript
// models/SavingGoal.ts
const SavingGoalSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  contributions: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });
```

### 3.2 Index Recommendations

```javascript
// Recommended indexes for performance
db.chatconversations.createIndex({ userId: 1, lastMessageAt: -1 });
db.finances.createIndex({ userId: 1, date: -1 });
db.finances.createIndex({ userId: 1, category: 1, date: -1 });
db.portfolios.createIndex({ userId: 1, type: 1 });
db.budgets.createIndex({ userId: 1, 'period.year': 1, 'period.month': 1 });
db.savinggoals.createIndex({ userId: 1, status: 1 });
```

---

## 4. API Design

### 4.1 Chat API Endpoints

#### POST /api/chat
Send a message and receive AI response.

```typescript
// Request
{
  message: string;
  conversationId?: string; // Optional, creates new if not provided
  includeFinancialContext?: boolean; // Default: true
}

// Response
{
  conversationId: string;
  response: {
    role: 'assistant';
    content: string;
    timestamp: string;
  };
  metadata: {
    tokensUsed: number;
    financialContextIncluded: boolean;
  };
}
```

#### GET /api/chat/conversations
List user's chat conversations.

```typescript
// Response
{
  conversations: Array<{
    id: string;
    title: string;
    lastMessage: string;
    lastMessageAt: string;
    messageCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

#### GET /api/chat/conversations/:id
Get full conversation history.

#### DELETE /api/chat/conversations/:id
Delete a conversation.

### 4.2 Financial Context API

#### GET /api/insights/summary
Get AI-ready financial summary for context injection.

```typescript
// Response
{
  overview: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    periodStart: string;
    periodEnd: string;
  };
  topCategories: Array<{
    category: string;
    total: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  portfolio: {
    totalValue: number;
    allocation: Record<string, number>;
    gainLoss: number;
  };
  budgets: Array<{
    category: string;
    limit: number;
    spent: number;
    remaining: number;
  }>;
  goals: Array<{
    name: string;
    progress: number;
    daysRemaining: number;
  }>;
}
```

### 4.3 Budget API Endpoints

```typescript
// POST /api/budgets - Create budget
// GET /api/budgets - List budgets
// PUT /api/budgets/:id - Update budget
// DELETE /api/budgets/:id - Delete budget
```

### 4.4 Saving Goals API Endpoints

```typescript
// POST /api/goals - Create goal
// GET /api/goals - List goals
// PUT /api/goals/:id - Update goal
// POST /api/goals/:id/contribute - Add contribution
// DELETE /api/goals/:id - Delete goal
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Core Chatbot)

#### 1.1 Environment Setup
- [ ] Add OpenAI API key to environment variables
- [ ] Install required dependencies: `openai`, rate limiting packages
- [ ] Set up error monitoring for API calls

#### 1.2 Database Models
- [ ] Create ChatConversation model
- [ ] Create UserPreferences model
- [ ] Add database indexes

#### 1.3 Chat API Implementation
- [ ] Create `/api/chat` POST endpoint
- [ ] Implement conversation management
- [ ] Add rate limiting middleware
- [ ] Implement error handling

#### 1.4 Chat UI Component
- [ ] Create ChatWidget component (floating button + modal)
- [ ] Implement message list with auto-scroll
- [ ] Add message input with send functionality
- [ ] Style with Tailwind CSS (dark mode support)
- [ ] Add typing indicator

### Phase 2: Financial Context Integration

#### 2.1 Context Builder Service
- [ ] Create financial data aggregation service
- [ ] Build user financial summary generator
- [ ] Implement context formatting for GPT-4

#### 2.2 System Prompt Engineering
- [ ] Design base system prompt for financial advisor persona
- [ ] Create dynamic context injection template
- [ ] Add safety guardrails for financial advice

#### 2.3 Insights API
- [ ] Create `/api/insights/summary` endpoint
- [ ] Implement spending analysis calculations
- [ ] Add portfolio performance metrics

### Phase 3: Budget and Goals Features

#### 3.1 Budget Management
- [ ] Create Budget model and API endpoints
- [ ] Implement budget tracking logic
- [ ] Add budget alerts/notifications
- [ ] Integrate with chatbot for budget advice

#### 3.2 Saving Goals
- [ ] Create SavingGoal model and API endpoints
- [ ] Implement progress tracking
- [ ] Add contribution history
- [ ] Integrate with chatbot for goal recommendations

#### 3.3 UI Components
- [ ] Create Budget management page
- [ ] Create Goals management page
- [ ] Update dashboard with budget/goal widgets

### Phase 4: Enhanced AI Features (Future)

#### 4.1 Expenditure Prediction
- [ ] Implement TensorFlow.js for browser-based predictions
- [ ] Train model on historical spending patterns
- [ ] Add prediction visualization to dashboard

#### 4.2 Anomaly Detection
- [ ] Implement statistical anomaly detection
- [ ] Add transaction flagging system
- [ ] Create alert notification system

#### 4.3 Investment Optimization
- [ ] Integrate with financial data APIs
- [ ] Implement portfolio analysis algorithms
- [ ] Add rebalancing recommendations

---

## 6. Technical Implementation Details

### 6.1 OpenAI Integration Service

```typescript
// lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ChatCompletionOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  userId: string;
  includeFinancialContext?: boolean;
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  const { messages, userId, includeFinancialContext = true } = options;
  
  let systemPrompt = getBaseSystemPrompt();
  
  if (includeFinancialContext) {
    const financialContext = await buildFinancialContext(userId);
    systemPrompt += '\n\n' + financialContext;
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    max_tokens: 1000,
    temperature: 0.7
  });
  
  return {
    content: response.choices[0].message.content,
    tokensUsed: response.usage?.total_tokens || 0
  };
}
```

### 6.2 System Prompt Template

```typescript
// lib/prompts.ts
export function getBaseSystemPrompt(): string {
  return `You are a helpful and knowledgeable personal finance assistant for an Indonesian user. 
Your role is to:

1. ANALYZE the user's financial data and provide personalized insights
2. ADVISE on budgeting, saving, and investment strategies
3. ANSWER general questions about personal finance
4. ENCOURAGE healthy financial habits

Guidelines:
- Always be supportive and non-judgmental about spending habits
- Provide actionable, specific advice when possible
- Use Indonesian Rupiah (Rp) for currency references
- Consider Indonesian financial context (local banks, investment options)
- If asked about specific investment products, provide educational information only
- Never provide specific stock picks or guarantee investment returns
- Remind users to consult licensed financial advisors for major decisions

Current date: ${new Date().toLocaleDateString('id-ID')}`;
}

export function formatFinancialContext(data: FinancialSummary): string {
  return `
USER'S CURRENT FINANCIAL SNAPSHOT:

INCOME & EXPENSES (Last 30 days):
- Total Income: Rp ${data.overview.totalIncome.toLocaleString()}
- Total Expenses: Rp ${data.overview.totalExpense.toLocaleString()}
- Net Savings: Rp ${data.overview.netSavings.toLocaleString()}

TOP SPENDING CATEGORIES:
${data.topCategories.map(c => `- ${c.category}: Rp ${c.total.toLocaleString()} (${c.percentage}%)`).join('\n')}

PORTFOLIO SUMMARY:
- Total Value: Rp ${data.portfolio.totalValue.toLocaleString()}
- Overall Gain/Loss: ${data.portfolio.gainLoss >= 0 ? '+' : ''}Rp ${data.portfolio.gainLoss.toLocaleString()}

${data.budgets.length > 0 ? `ACTIVE BUDGETS:
${data.budgets.map(b => `- ${b.category}: Rp ${b.spent.toLocaleString()} / Rp ${b.limit.toLocaleString()} (${Math.round(b.spent/b.limit*100)}%)`).join('\n')}` : ''}

${data.goals.length > 0 ? `SAVING GOALS:
${data.goals.map(g => `- ${g.name}: ${g.progress}% complete`).join('\n')}` : ''}

Use this information to provide personalized, contextual advice.`;
}
```

### 6.3 Chat Widget Component Structure

```typescript
// components/ChatWidget.tsx - Component structure
interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Key features:
// - Floating action button (bottom-right corner)
// - Slide-up modal on mobile, side panel on desktop
// - Conversation list sidebar
// - Message thread with auto-scroll
// - Input with send button and loading state
// - Markdown rendering for AI responses
// - Code syntax highlighting for financial calculations
```

### 6.4 Rate Limiting Strategy

```typescript
// middleware/rateLimit.ts
const RATE_LIMITS = {
  chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  insights: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  }
};

// Implementation using in-memory store or Redis for production
```

---

## 7. Security Considerations

### 7.1 API Security
- [ ] Implement rate limiting on all AI endpoints
- [ ] Add request validation and sanitization
- [ ] Use secure headers for API responses
- [ ] Implement API key rotation strategy

### 7.2 Data Privacy
- [ ] Encrypt sensitive financial context before sending to OpenAI
- [ ] Implement data retention policies for chat history
- [ ] Add user consent for AI data processing
- [ ] Provide data export and deletion options

### 7.3 Prompt Injection Prevention
- [ ] Sanitize user input before including in prompts
- [ ] Use role separation in API calls
- [ ] Implement output validation
- [ ] Monitor for suspicious prompt patterns

### 7.4 Financial Advice Disclaimer
- [ ] Add prominent disclaimer about AI limitations
- [ ] Include "not financial advice" warnings
- [ ] Log sensitive financial queries for review

---

## 8. Testing Strategy

### 8.1 Unit Tests
- [ ] OpenAI service integration tests
- [ ] Financial context builder tests
- [ ] Rate limiting middleware tests
- [ ] API endpoint validation tests

### 8.2 Integration Tests
- [ ] End-to-end chat flow tests
- [ ] Conversation persistence tests
- [ ] Context injection accuracy tests

### 8.3 User Acceptance Tests
- [ ] Chat UI responsiveness
- [ ] Financial advice quality review
- [ ] Error handling user experience
- [ ] Performance under load

---

## 9. Deployment Considerations

### 9.1 Environment Variables
```env
# Required for Phase 1
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-... (optional)

# Rate limiting (optional, for production)
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...

# Monitoring (optional)
SENTRY_DSN=...
```

### 9.2 Cost Estimation
| Model | Input Cost | Output Cost | Est. Monthly (1000 users) |
|-------|------------|-------------|---------------------------|
| GPT-4 Turbo | $0.01/1K tokens | $0.03/1K tokens | ~$150-300 |
| GPT-3.5 Turbo | $0.0015/1K tokens | $0.002/1K tokens | ~$15-30 |

Recommendation: Start with GPT-4 Turbo for quality, add fallback to GPT-3.5 for simple queries.

### 9.3 Monitoring
- [ ] Set up OpenAI API usage monitoring
- [ ] Implement error tracking (Sentry)
- [ ] Add user feedback collection
- [ ] Monitor response quality metrics

---

## 10. File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── route.ts                 # Main chat endpoint
│   │   │   └── conversations/
│   │   │       ├── route.ts             # List conversations
│   │   │       └── [id]/
│   │   │           └── route.ts         # Single conversation
│   │   ├── insights/
│   │   │   └── summary/
│   │   │       └── route.ts             # Financial summary
│   │   ├── budgets/
│   │   │   ├── route.ts                 # Budget CRUD
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── goals/
│   │       ├── route.ts                 # Goals CRUD
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── contribute/
│   │               └── route.ts
│   ├── chat/
│   │   └── page.tsx                     # Full chat page
│   ├── budgets/
│   │   └── page.tsx                     # Budget management
│   └── goals/
│       └── page.tsx                     # Goals management
├── components/
│   ├── chat/
│   │   ├── ChatWidget.tsx               # Floating chat widget
│   │   ├── ChatMessage.tsx              # Message bubble
│   │   ├── ChatInput.tsx                # Input component
│   │   ├── ConversationList.tsx         # Sidebar list
│   │   └── TypingIndicator.tsx
│   ├── budget/
│   │   ├── BudgetCard.tsx
│   │   └── BudgetForm.tsx
│   └── goals/
│       ├── GoalCard.tsx
│       └── GoalForm.tsx
├── lib/
│   ├── openai.ts                        # OpenAI client
│   ├── prompts.ts                       # System prompts
│   ├── context-builder.ts               # Financial context
│   └── rate-limit.ts                    # Rate limiting
├── models/
│   ├── ChatConversation.ts
│   ├── UserPreferences.ts
│   ├── Budget.ts
│   └── SavingGoal.ts
└── types/
    ├── chat.ts                          # Chat types
    └── insights.ts                      # Insights types
```

---

## 11. Implementation Checklist Summary

### Phase 1: Core Chatbot
- [ ] Set up OpenAI integration
- [ ] Create ChatConversation model
- [ ] Implement /api/chat endpoint
- [ ] Build ChatWidget component
- [ ] Add basic error handling
- [ ] Implement rate limiting

### Phase 2: Financial Context
- [ ] Build context aggregation service
- [ ] Create /api/insights/summary endpoint
- [ ] Design system prompts
- [ ] Integrate context with chat

### Phase 3: Budget & Goals
- [ ] Create Budget model and APIs
- [ ] Create SavingGoal model and APIs
- [ ] Build management UI pages
- [ ] Integrate with chatbot context

### Phase 4: Future Enhancements
- [ ] Expenditure prediction (TensorFlow.js)
- [ ] Anomaly detection
- [ ] Investment optimization
- [ ] Multi-language support

---

## 12. Architecture Diagram

```mermaid
flowchart TB
    subgraph Client [Next.js Client]
        UI[React UI Components]
        CW[ChatWidget]
        DB[Dashboard]
    end
    
    subgraph API [Next.js API Routes]
        CA[/api/chat]
        IA[/api/insights]
        FA[/api/finances]
        PA[/api/portfolio]
        BA[/api/budgets]
        GA[/api/goals]
    end
    
    subgraph Services [Internal Services]
        OAI[OpenAI Service]
        CTX[Context Builder]
        RL[Rate Limiter]
    end
    
    subgraph External [External APIs]
        GPT[OpenAI GPT-4]
    end
    
    subgraph Database [MongoDB]
        UC[(Users)]
        FC[(Finances)]
        PC[(Portfolio)]
        CC[(Conversations)]
        BC[(Budgets)]
        GC[(Goals)]
    end
    
    UI --> CA
    CW --> CA
    DB --> IA
    DB --> FA
    DB --> PA
    
    CA --> RL
    RL --> OAI
    OAI --> CTX
    CTX --> FC
    CTX --> PC
    CTX --> BC
    CTX --> GC
    OAI --> GPT
    
    CA --> CC
    FA --> FC
    PA --> PC
    BA --> BC
    GA --> GC
```

---

## 13. Success Metrics

### User Engagement
- Chat sessions per user per week
- Average messages per conversation
- Return rate to chat feature

### Quality Metrics
- User satisfaction rating (thumbs up/down on responses)
- Query resolution rate
- Response relevance score

### Technical Metrics
- API response time (target: < 3s)
- Error rate (target: < 1%)
- Token usage efficiency

### Business Metrics
- Feature adoption rate
- User retention impact
- Support ticket reduction

---

*Document Version: 1.0*
*Created: February 2026*
*Author: Architecture Team*
