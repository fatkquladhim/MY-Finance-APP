import { Schema, model, models } from 'mongoose';

const FinanceSchema = new Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
});

export default models.Finance || model('Finance', FinanceSchema);