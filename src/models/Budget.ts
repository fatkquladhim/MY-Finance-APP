import { Schema, model, models } from 'mongoose';

const BudgetSchema = new Schema({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  monthlyLimit: { type: Number, required: true },
  period: { 
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true }
  },
  alertThreshold: { type: Number, default: 80 }, // percentage
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index for efficient queries
BudgetSchema.index({ userId: 1, 'period.year': 1, 'period.month': 1 });
BudgetSchema.index({ userId: 1, category: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });

export default models.Budget || model('Budget', BudgetSchema);
