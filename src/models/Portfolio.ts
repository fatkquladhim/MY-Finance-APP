import { Schema, model, models } from 'mongoose';

const PortfolioSchema = new Schema({
  userId: { type: String, required: true },
  asset: { type: String, required: true },
  type: { type: String, enum: ['stock', 'crypto', 'fund', 'property'], required: true },
  quantity: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  purchasePrice: { type: Number },
}, { timestamps: true });

export default models.Portfolio || model('Portfolio', PortfolioSchema);