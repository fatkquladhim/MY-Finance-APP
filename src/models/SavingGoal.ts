import { Schema, model, models } from 'mongoose';

const ContributionSchema = new Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: String
}, { _id: false });

const SavingGoalSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'abandoned'], 
    default: 'active' 
  },
  contributions: [ContributionSchema]
}, { timestamps: true });

// Compound index for efficient queries
SavingGoalSchema.index({ userId: 1, status: 1 });

export default models.SavingGoal || model('SavingGoal', SavingGoalSchema);
