# MongoDB to PostgreSQL (Vercel Postgres) Migration Plan

## Overview

This document outlines the migration plan for converting the My Finance App from MongoDB (using Mongoose) to PostgreSQL (using Vercel Postgres).

## Current MongoDB Setup

### Models
1. **User** - User authentication and profile
2. **Finance** - Income and expense transactions
3. **Budget** - Monthly budget limits per category
4. **SavingGoal** - Financial goals with contributions
5. **Portfolio** - Investment portfolio items
6. **ChatConversation** - AI chat conversations with messages
7. **UserPreferences** - User settings and preferences

### API Routes Using MongoDB
- `/api/register` - User registration
- `/api/auth/[...nextauth]` - Authentication
- `/api/finances` - CRUD operations
- `/api/budgets` - CRUD operations with aggregation
- `/api/goals` - CRUD operations
- `/api/portfolio` - CRUD operations
- `/api/chat/conversations` - CRUD operations
- `/api/chat/conversations/[id]` - Single conversation operations
- `/api/goals/[id]/contribute` - Add contribution to goal
- `/api/profile` - Update profile
- `/api/insights/summary` - Financial summary (uses context-builder)

### Libraries
- `mongoose` - MongoDB ODM
- `bcrypt` - Password hashing

## PostgreSQL Migration Plan

### Phase 1: Setup and Dependencies

1. **Install PostgreSQL Dependencies**
   - `@vercel/postgres` - Vercel Postgres client
   - `pg` - PostgreSQL client (optional, for direct queries)

2. **Update Environment Variables**
   - Replace `MONGODB_URI` with `POSTGRES_URL` (Vercel Postgres)
   - Or use individual connection parameters:
     - `POSTGRES_HOST`
     - `POSTGRES_USER`
     - `POSTGRES_PASSWORD`
     - `POSTGRES_DATABASE`

### Phase 2: Database Schema Design

#### PostgreSQL Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Finances table
CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_finances_user_id ON finances(user_id);
CREATE INDEX idx_finances_date ON finances(date DESC);
CREATE INDEX idx_finances_user_date ON finances(user_id, date DESC);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  monthly_limit DECIMAL(15, 2) NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, period_year, period_month)
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(user_id, period_year, period_month);

-- Saving goals table
CREATE TABLE saving_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) DEFAULT 0,
  deadline TIMESTAMP,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saving_goals_user_id ON saving_goals(user_id);
CREATE INDEX idx_saving_goals_status ON saving_goals(user_id, status);

-- Goal contributions table
CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES saving_goals(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);

CREATE INDEX idx_goal_contributions_goal_id ON goal_contributions(goal_id);

-- Portfolio table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('stock', 'crypto', 'fund', 'property')),
  quantity DECIMAL(15, 4) NOT NULL,
  current_value DECIMAL(15, 2) NOT NULL,
  purchase_price DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);

-- Chat conversations table
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Conversation',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_last_message ON chat_conversations(user_id, last_message_at DESC);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tokens_used INTEGER,
  model VARCHAR(100),
  finance_context BOOLEAN DEFAULT false
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_enable_financial_context BOOLEAN DEFAULT true,
  chat_preferred_language VARCHAR(10) DEFAULT 'id',
  chat_response_style VARCHAR(20) DEFAULT 'detailed' CHECK (chat_response_style IN ('concise', 'detailed', 'educational')),
  notification_anomaly_alerts BOOLEAN DEFAULT true,
  notification_budget_reminders BOOLEAN DEFAULT true,
  notification_weekly_insights BOOLEAN DEFAULT false,
  privacy_share_data_with_ai BOOLEAN DEFAULT true,
  privacy_retain_chat_history BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### Phase 3: Create PostgreSQL Connection Library

Create `src/lib/postgres.ts`:
```typescript
import { sql } from '@vercel/postgres';

let pool: any = null;

export async function connectToDatabase() {
  if (!pool) {
    pool = sql;
  }
  return pool;
}
```

### Phase 4: Create Database Models

Create new model files using SQL queries instead of Mongoose schemas:

1. `src/models/User.ts` - User CRUD operations
2. `src/models/Finance.ts` - Finance CRUD operations
3. `src/models/Budget.ts` - Budget CRUD operations
4. `src/models/SavingGoal.ts` - SavingGoal CRUD operations
5. `src/models/Portfolio.ts` - Portfolio CRUD operations
6. `src/models/ChatConversation.ts` - ChatConversation CRUD operations
7. `src/models/UserPreferences.ts` - UserPreferences CRUD operations

### Phase 5: Update API Routes

Update all API routes to use PostgreSQL instead of MongoDB:

1. `/api/register` - Use SQL INSERT for user creation
2. `/api/auth/[...nextauth]` - Use SQL SELECT for user lookup
3. `/api/finances` - Use SQL SELECT/INSERT/UPDATE/DELETE
4. `/api/budgets` - Use SQL with JOIN for aggregation
5. `/api/goals` - Use SQL SELECT/INSERT/UPDATE/DELETE
6. `/api/portfolio` - Use SQL SELECT/INSERT/UPDATE/DELETE
7. `/api/chat/conversations` - Use SQL SELECT/INSERT/UPDATE/DELETE
8. `/api/chat/conversations/[id]` - Use SQL with JOIN for messages
9. `/api/goals/[id]/contribute` - Use SQL INSERT for contributions
10. `/api/profile` - Use SQL UPDATE for profile
11. `/api/insights/summary` - Update context-builder to use SQL

### Phase 6: Update Context Builder

Update `src/lib/context-builder.ts` to use SQL queries instead of Mongoose aggregation.

### Phase 7: Data Migration Script

Create a migration script to transfer existing data from MongoDB to PostgreSQL:

```typescript
// scripts/migrate-to-postgres.ts
import mongoose from 'mongoose';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI!);

// Migrate users
const users = await mongoose.connection.db.collection('users').find({}).toArray();
for (const user of users) {
  await sql`
    INSERT INTO users (id, name, email, password, bio, avatar, created_at, updated_at)
    VALUES (${user._id.toString()}, ${user.name}, ${user.email}, ${user.password}, ${user.bio || null}, ${user.avatar || null}, ${user.createdAt}, ${user.updatedAt})
    ON CONFLICT (email) DO NOTHING
  `;
}

// Migrate finances
const finances = await mongoose.connection.db.collection('finances').find({}).toArray();
for (const finance of finances) {
  await sql`
    INSERT INTO finances (id, user_id, type, amount, category, description, date)
    VALUES (${finance._id.toString()}, ${finance.userId}, ${finance.type}, ${finance.amount}, ${finance.category}, ${finance.description || null}, ${finance.date})
  `;
}

// ... continue for other collections
```

### Phase 8: Cleanup

1. Remove `mongoose` from `package.json`
2. Delete `src/lib/mongodb.ts`
3. Delete all Mongoose model files in `src/models/`
4. Update `.env.example` with PostgreSQL variables

## Key Differences to Consider

### 1. ID Types
- MongoDB: ObjectId (string)
- PostgreSQL: UUID (use `gen_random_uuid()`)

### 2. Date Handling
- MongoDB: Date objects
- PostgreSQL: TIMESTAMP types

### 3. Aggregation
- MongoDB: `$match`, `$group`, `$sum` pipeline
- PostgreSQL: GROUP BY, SUM, COUNT with JOINs

### 4. Nested Arrays
- MongoDB: Arrays embedded in documents
- PostgreSQL: Separate tables with foreign keys (e.g., goal_contributions, chat_messages)

### 5. Password Hashing
- MongoDB: Pre-save hook in Mongoose schema
- PostgreSQL: Hash before INSERT in API route

## Migration Checklist

- [ ] Install PostgreSQL dependencies
- [ ] Create PostgreSQL connection library
- [ ] Create SQL schema file
- [ ] Create database migration script
- [ ] Update all model files
- [ ] Update all API routes
- [ ] Update context-builder.ts
- [ ] Update .env.example
- [ ] Test all functionality
- [ ] Remove MongoDB dependencies
- [ ] Remove old MongoDB files

## Testing Strategy

1. **Unit Tests**: Test each model's CRUD operations
2. **Integration Tests**: Test API routes with PostgreSQL
3. **Data Validation**: Verify migrated data integrity
4. **Performance Tests**: Compare query performance

## Rollback Plan

If issues arise:
1. Keep MongoDB connection available temporarily
2. Use feature flags to switch between databases
3. Revert API routes to use MongoDB if needed
4. Restore from MongoDB backup if data corruption occurs
