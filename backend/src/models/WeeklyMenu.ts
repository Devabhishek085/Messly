import { Schema, model, Document } from 'mongoose';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface IMealContent {
  items: string[];
}

export interface IWeeklyMenu extends Document {
  dayOfWeek: DayOfWeek;
  breakfast: IMealContent;
  lunch: IMealContent;
  snacks: IMealContent;
  dinner: IMealContent;
  updatedAt: Date;
}

const mealContentSchema = new Schema<IMealContent>({
  items: [{ type: String, required: true }],
}, { _id: false });

const weeklyMenuSchema = new Schema<IWeeklyMenu>({
  dayOfWeek: { 
    type: String, 
    required: true, 
    unique: true, 
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] 
  },
  breakfast: { type: mealContentSchema, default: { items: [] } },
  lunch: { type: mealContentSchema, default: { items: [] } },
  snacks: { type: mealContentSchema, default: { items: [] } },
  dinner: { type: mealContentSchema, default: { items: [] } },
  updatedAt: { type: Date, default: Date.now },
});

export const WeeklyMenu = model<IWeeklyMenu>('WeeklyMenu', weeklyMenuSchema);
