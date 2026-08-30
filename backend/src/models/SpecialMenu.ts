import { Schema, model, Document } from 'mongoose';
import { IMealContent } from './WeeklyMenu.js';

export interface ISpecialMenu extends Document {
  date: string; // YYYY-MM-DD
  breakfast?: IMealContent;
  lunch?: IMealContent;
  snacks?: IMealContent;
  dinner?: IMealContent;
  updatedAt: Date;
}

const mealContentSchema = new Schema<IMealContent>({
  items: [{ type: String, required: true }],
}, { _id: false });

const specialMenuSchema = new Schema<ISpecialMenu>({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  breakfast: { type: mealContentSchema, required: false },
  lunch: { type: mealContentSchema, required: false },
  snacks: { type: mealContentSchema, required: false },
  dinner: { type: mealContentSchema, required: false },
  updatedAt: { type: Date, default: Date.now },
});

export const SpecialMenu = model<ISpecialMenu>('SpecialMenu', specialMenuSchema);
