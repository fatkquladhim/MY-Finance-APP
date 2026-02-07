/**
 * MongoDB to PostgreSQL Migration Script
 * 
 * This script migrates data from MongoDB to PostgreSQL.
 * Run this script with: npx tsx scripts/migrate-to-postgres.ts
 * 
 * Prerequisites:
 * - MongoDB connection string in MONGODB_URI environment variable
 * - PostgreSQL connection string in POSTGRES_URL environment variable
 */

import mongoose from 'mongoose';
import { sql } from '@vercel/postgres';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

// Connect to MongoDB
console.log('Connecting to MongoDB...');
await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

// Migrate Users
console.log('\n=== Migrating Users ===');
const users = await mongoose.connection.db.collection('users').find({}).toArray();
console.log(`Found ${users.length} users`);

for (const user of users) {
  try {
    await sql`
      INSERT INTO users (id, name, email, password, bio, avatar, created_at, updated_at)
      VALUES (
        ${user._id.toString()},
        ${user.name},
        ${user.email},
        ${user.password},
        ${user.bio || null},
        ${user.avatar || null},
        ${user.createdAt},
        ${user.updatedAt}
      )
      ON CONFLICT (email) DO NOTHING
    `;
    console.log(`Migrated user: ${user.email}`);
  } catch (error) {
    console.error(`Error migrating user ${user.email}:`, error);
  }
}

// Migrate Finances
console.log('\n=== Migrating Finances ===');
const finances = await mongoose.connection.db.collection('finances').find({}).toArray();
console.log(`Found ${finances.length} finances`);

for (const finance of finances) {
  try {
    await sql`
      INSERT INTO finances (id, user_id, type, amount, category, description, date)
      VALUES (
        ${finance._id.toString()},
        ${finance.userId},
        ${finance.type},
        ${finance.amount},
        ${finance.category},
        ${finance.description || null},
        ${finance.date}
      )
    `;
    console.log(`Migrated finance: ${finance._id.toString()}`);
  } catch (error) {
    console.error(`Error migrating finance ${finance._id.toString()}:`, error);
  }
}

// Migrate Budgets
console.log('\n=== Migrating Budgets ===');
const budgets = await mongoose.connection.db.collection('budgets').find({}).toArray();
console.log(`Found ${budgets.length} budgets`);

for (const budget of budgets) {
  try {
    await sql`
      INSERT INTO budgets (id, user_id, category, monthly_limit, period_month, period_year, alert_threshold, is_active, created_at, updated_at)
      VALUES (
        ${budget._id.toString()},
        ${budget.userId},
        ${budget.category},
        ${budget.monthlyLimit},
        ${budget.period.month},
        ${budget.period.year},
        ${budget.alertThreshold || 80},
        ${budget.isActive !== undefined ? budget.isActive : true},
        ${budget.createdAt},
        ${budget.updatedAt}
      )
      ON CONFLICT (user_id, category, period_year, period_month) DO NOTHING
    `;
    console.log(`Migrated budget: ${budget.category} for ${budget.period.year}-${budget.period.month}`);
  } catch (error) {
    console.error(`Error migrating budget ${budget._id.toString()}:`, error);
  }
}

// Migrate Saving Goals
console.log('\n=== Migrating Saving Goals ===');
const savingGoals = await mongoose.connection.db.collection('savinggoals').find({}).toArray();
console.log(`Found ${savingGoals.length} saving goals`);

for (const goal of savingGoals) {
  try {
    await sql`
      INSERT INTO saving_goals (id, user_id, name, target_amount, current_amount, deadline, priority, status, created_at, updated_at)
      VALUES (
        ${goal._id.toString()},
        ${goal.userId},
        ${goal.name},
        ${goal.targetAmount},
        ${goal.currentAmount || 0},
        ${goal.deadline || null},
        ${goal.priority || 'medium'},
        ${goal.status || 'active'},
        ${goal.createdAt},
        ${goal.updatedAt}
      )
    `;
    console.log(`Migrated saving goal: ${goal.name}`);
    
    // Migrate contributions
    if (goal.contributions && goal.contributions.length > 0) {
      for (const contribution of goal.contributions) {
        try {
          await sql`
            INSERT INTO goal_contributions (id, goal_id, amount, date, note)
            VALUES (
              ${contribution._id ? contribution._id.toString() : crypto.randomUUID()},
              ${goal._id.toString()},
              ${contribution.amount},
              ${contribution.date},
              ${contribution.note || null}
            )
          `;
        } catch (error) {
          console.error(`Error migrating contribution:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error migrating saving goal ${goal._id.toString()}:`, error);
  }
}

// Migrate Portfolios
console.log('\n=== Migrating Portfolios ===');
const portfolios = await mongoose.connection.db.collection('portfolios').find({}).toArray();
console.log(`Found ${portfolios.length} portfolios`);

for (const portfolio of portfolios) {
  try {
    await sql`
      INSERT INTO portfolios (id, user_id, asset, type, quantity, current_value, purchase_price, created_at, updated_at)
      VALUES (
        ${portfolio._id.toString()},
        ${portfolio.userId},
        ${portfolio.asset},
        ${portfolio.type},
        ${portfolio.quantity},
        ${portfolio.currentValue},
        ${portfolio.purchasePrice || null},
        ${portfolio.createdAt},
        ${portfolio.updatedAt}
      )
    `;
    console.log(`Migrated portfolio: ${portfolio.asset}`);
  } catch (error) {
    console.error(`Error migrating portfolio ${portfolio._id.toString()}:`, error);
  }
}

// Migrate Chat Conversations
console.log('\n=== Migrating Chat Conversations ===');
const chatConversations = await mongoose.connection.db.collection('chatconversations').find({}).toArray();
console.log(`Found ${chatConversations.length} chat conversations`);

for (const conv of chatConversations) {
  try {
    await sql`
      INSERT INTO chat_conversations (id, user_id, title, status, last_message_at, created_at, updated_at)
      VALUES (
        ${conv._id.toString()},
        ${conv.userId},
        ${conv.title || 'New Conversation'},
        ${conv.status || 'active'},
        ${conv.lastMessageAt || conv.createdAt},
        ${conv.createdAt},
        ${conv.updatedAt}
      )
    `;
    console.log(`Migrated chat conversation: ${conv.title}`);
    
    // Migrate messages
    if (conv.messages && conv.messages.length > 0) {
      for (const message of conv.messages) {
        try {
          await sql`
            INSERT INTO chat_messages (id, conversation_id, role, content, timestamp, tokens_used, model, finance_context)
            VALUES (
              ${message._id ? message._id.toString() : crypto.randomUUID()},
              ${conv._id.toString()},
              ${message.role},
              ${message.content},
              ${message.timestamp},
              ${message.metadata?.tokensUsed || null},
              ${message.metadata?.model || null},
              ${message.metadata?.financeContext || false}
            )
          `;
        } catch (error) {
          console.error(`Error migrating message:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error migrating chat conversation ${conv._id.toString()}:`, error);
  }
}

// Migrate User Preferences
console.log('\n=== Migrating User Preferences ===');
const userPreferences = await mongoose.connection.db.collection('userpreferences').find({}).toArray();
console.log(`Found ${userPreferences.length} user preferences`);

for (const pref of userPreferences) {
  try {
    await sql`
      INSERT INTO user_preferences (
        id, user_id,
        chat_enable_financial_context, chat_preferred_language, chat_response_style,
        notification_anomaly_alerts, notification_budget_reminders, notification_weekly_insights,
        privacy_share_data_with_ai, privacy_retain_chat_history,
        created_at, updated_at
      )
      VALUES (
        ${pref._id.toString()},
        ${pref.userId},
        ${pref.chatSettings?.enableFinancialContext !== undefined ? pref.chatSettings.enableFinancialContext : true},
        ${pref.chatSettings?.preferredLanguage || 'id'},
        ${pref.chatSettings?.responseStyle || 'detailed'},
        ${pref.notificationSettings?.anomalyAlerts !== undefined ? pref.notificationSettings.anomalyAlerts : true},
        ${pref.notificationSettings?.budgetReminders !== undefined ? pref.notificationSettings.budgetReminders : true},
        ${pref.notificationSettings?.weeklyInsights !== undefined ? pref.notificationSettings.weeklyInsights : false},
        ${pref.privacySettings?.shareDataWithAI !== undefined ? pref.privacySettings.shareDataWithAI : true},
        ${pref.privacySettings?.retainChatHistory !== undefined ? pref.privacySettings.retainChatHistory : true},
        ${pref.createdAt},
        ${pref.updatedAt}
      )
      ON CONFLICT (user_id) DO NOTHING
    `;
    console.log(`Migrated user preferences for user: ${pref.userId}`);
  } catch (error) {
    console.error(`Error migrating user preferences ${pref._id.toString()}:`, error);
  }
}

// Close connections
console.log('\n=== Migration Complete ===');
console.log('Closing MongoDB connection...');
await mongoose.connection.close();
console.log('Migration completed successfully!');
