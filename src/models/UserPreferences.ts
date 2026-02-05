import { Schema, model, models } from 'mongoose';

const UserPreferencesSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  chatSettings: {
    enableFinancialContext: { type: Boolean, default: true },
    preferredLanguage: { type: String, default: 'id' },
    responseStyle: { 
      type: String, 
      enum: ['concise', 'detailed', 'educational'], 
      default: 'detailed' 
    }
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

export default models.UserPreferences || model('UserPreferences', UserPreferencesSchema);
