import { Schema, model, Document } from 'mongoose';

export type EventType = 'app_open' | 'menu_view' | 'reminder_enabled' | 'notification_permission_granted';

export interface IDeviceEvent extends Document {
  deviceId: string;
  eventType: EventType;
  meta?: Record<string, any>;
  createdAt: Date;
}

const deviceEventSchema = new Schema<IDeviceEvent>({
  deviceId: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['app_open', 'menu_view', 'reminder_enabled', 'notification_permission_granted'],
    index: true
  },
  meta: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const DeviceEvent = model<IDeviceEvent>('DeviceEvent', deviceEventSchema);
