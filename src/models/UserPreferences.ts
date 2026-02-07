import { sql } from '@vercel/postgres';

export interface UserPreferences {
  id: string;
  user_id: string;
  chat_enable_financial_context: boolean;
  chat_preferred_language: string;
  chat_response_style: 'concise' | 'detailed' | 'educational';
  notification_anomaly_alerts: boolean;
  notification_budget_reminders: boolean;
  notification_weekly_insights: boolean;
  privacy_share_data_with_ai: boolean;
  privacy_retain_chat_history: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserPreferencesInput {
  user_id: string;
  chat_enable_financial_context?: boolean;
  chat_preferred_language?: string;
  chat_response_style?: 'concise' | 'detailed' | 'educational';
  notification_anomaly_alerts?: boolean;
  notification_budget_reminders?: boolean;
  notification_weekly_insights?: boolean;
  privacy_share_data_with_ai?: boolean;
  privacy_retain_chat_history?: boolean;
}

export interface UpdateUserPreferencesInput {
  chat_enable_financial_context?: boolean;
  chat_preferred_language?: string;
  chat_response_style?: 'concise' | 'detailed' | 'educational';
  notification_anomaly_alerts?: boolean;
  notification_budget_reminders?: boolean;
  notification_weekly_insights?: boolean;
  privacy_share_data_with_ai?: boolean;
  privacy_retain_chat_history?: boolean;
}

export const UserPreferences = {
  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const result = await sql<UserPreferences>`
      SELECT * FROM user_preferences WHERE user_id = ${userId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<UserPreferences | null> {
    const result = await sql<UserPreferences>`
      SELECT * FROM user_preferences WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async create(input: CreateUserPreferencesInput): Promise<UserPreferences> {
    const result = await sql<UserPreferences>`
      INSERT INTO user_preferences (
        user_id,
        chat_enable_financial_context,
        chat_preferred_language,
        chat_response_style,
        notification_anomaly_alerts,
        notification_budget_reminders,
        notification_weekly_insights,
        privacy_share_data_with_ai,
        privacy_retain_chat_history
      )
      VALUES (
        ${input.user_id},
        ${input.chat_enable_financial_context !== undefined ? input.chat_enable_financial_context : true},
        ${input.chat_preferred_language || 'id'},
        ${input.chat_response_style || 'detailed'},
        ${input.notification_anomaly_alerts !== undefined ? input.notification_anomaly_alerts : true},
        ${input.notification_budget_reminders !== undefined ? input.notification_budget_reminders : true},
        ${input.notification_weekly_insights !== undefined ? input.notification_weekly_insights : false},
        ${input.privacy_share_data_with_ai !== undefined ? input.privacy_share_data_with_ai : true},
        ${input.privacy_retain_chat_history !== undefined ? input.privacy_retain_chat_history : true}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async findOneAndUpdate(query: { userId?: string; id?: string }, updates: UpdateUserPreferencesInput): Promise<UserPreferences | null> {
    const { userId, id } = query;
    const {
      chat_enable_financial_context,
      chat_preferred_language,
      chat_response_style,
      notification_anomaly_alerts,
      notification_budget_reminders,
      notification_weekly_insights,
      privacy_share_data_with_ai,
      privacy_retain_chat_history
    } = updates;
    
    let result;
    
    if (userId) {
      result = await sql<UserPreferences>`
        UPDATE user_preferences
        SET 
          chat_enable_financial_context = COALESCE(${chat_enable_financial_context !== undefined ? chat_enable_financial_context : null}, chat_enable_financial_context),
          chat_preferred_language = COALESCE(${chat_preferred_language || null}, chat_preferred_language),
          chat_response_style = COALESCE(${chat_response_style || null}, chat_response_style),
          notification_anomaly_alerts = COALESCE(${notification_anomaly_alerts !== undefined ? notification_anomaly_alerts : null}, notification_anomaly_alerts),
          notification_budget_reminders = COALESCE(${notification_budget_reminders !== undefined ? notification_budget_reminders : null}, notification_budget_reminders),
          notification_weekly_insights = COALESCE(${notification_weekly_insights !== undefined ? notification_weekly_insights : null}, notification_weekly_insights),
          privacy_share_data_with_ai = COALESCE(${privacy_share_data_with_ai !== undefined ? privacy_share_data_with_ai : null}, privacy_share_data_with_ai),
          privacy_retain_chat_history = COALESCE(${privacy_retain_chat_history !== undefined ? privacy_retain_chat_history : null}, privacy_retain_chat_history),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    } else if (id) {
      result = await sql<UserPreferences>`
        UPDATE user_preferences
        SET 
          chat_enable_financial_context = COALESCE(${chat_enable_financial_context !== undefined ? chat_enable_financial_context : null}, chat_enable_financial_context),
          chat_preferred_language = COALESCE(${chat_preferred_language || null}, chat_preferred_language),
          chat_response_style = COALESCE(${chat_response_style || null}, chat_response_style),
          notification_anomaly_alerts = COALESCE(${notification_anomaly_alerts !== undefined ? notification_anomaly_alerts : null}, notification_anomaly_alerts),
          notification_budget_reminders = COALESCE(${notification_budget_reminders !== undefined ? notification_budget_reminders : null}, notification_budget_reminders),
          notification_weekly_insights = COALESCE(${notification_weekly_insights !== undefined ? notification_weekly_insights : null}, notification_weekly_insights),
          privacy_share_data_with_ai = COALESCE(${privacy_share_data_with_ai !== undefined ? privacy_share_data_with_ai : null}, privacy_share_data_with_ai),
          privacy_retain_chat_history = COALESCE(${privacy_retain_chat_history !== undefined ? privacy_retain_chat_history : null}, privacy_retain_chat_history),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else {
      return null;
    }
    
    return result.rows[0] || null;
  },

  async findOneAndDelete(query: { userId?: string; id?: string }): Promise<UserPreferences | null> {
    const { userId, id } = query;
    
    let result;
    
    if (userId) {
      result = await sql<UserPreferences>`
        DELETE FROM user_preferences WHERE user_id = ${userId}
        RETURNING *
      `;
    } else if (id) {
      result = await sql<UserPreferences>`
        DELETE FROM user_preferences WHERE id = ${id}
        RETURNING *
      `;
    } else {
      return null;
    }
    
    return result.rows[0] || null;
  }
};

export default UserPreferences;
