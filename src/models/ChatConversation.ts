import { Schema, model, models } from 'mongoose';

const ChatMessageSchema = new Schema({
  role: { 
    type: String, 
    enum: ['user', 'assistant', 'system'], 
    required: true 
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    tokensUsed: Number,
    model: String,
    financeContext: Boolean
  }
}, { _id: false });

const ChatConversationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: [ChatMessageSchema],
  status: { 
    type: String, 
    enum: ['active', 'archived'], 
    default: 'active' 
  },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for efficient queries
ChatConversationSchema.index({ userId: 1, lastMessageAt: -1 });

export default models.ChatConversation || model('ChatConversation', ChatConversationSchema);
