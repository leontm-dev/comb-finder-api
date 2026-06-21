import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, type Types } from 'mongoose';

export type VlrEventDocument = HydratedDocument<VlrEvent>;

@Schema({ collection: 'events', timestamps: true })
export class VlrEvent {
  readonly _id: Types.ObjectId;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  @Prop({ required: true, unique: true, type: String })
  vlrId: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  region: string;

  @Prop({ required: true, type: String })
  dates: string;

  @Prop({ default: null })
  patch: string | null;

  @Prop({ type: String, default: null })
  icon: string | null;
}

export const VlrEventSchema = SchemaFactory.createForClass(VlrEvent);
