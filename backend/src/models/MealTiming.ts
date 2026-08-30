import { Schema, model, Document } from 'mongoose';

export type MealKey = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface IMealTiming extends Document {
  mealKey: MealKey;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

const mealTimingSchema = new Schema<IMealTiming>({
  mealKey: { 
    type: String, 
    required: true, 
    unique: true, 
    enum: ['breakfast', 'lunch', 'snacks', 'dinner'] 
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

export const MealTiming = model<IMealTiming>('MealTiming', mealTimingSchema);
