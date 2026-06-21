import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, type Types } from 'mongoose';

export type EventProposalDocument =
  HydratedDocument<EventProposal>;

@Schema({ collection: 'proposals', timestamps: true })
export class EventProposal {
  readonly _id: Types.ObjectId;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  comment: string;

  @Prop({ required: true, type: String })
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

export const EventProposalSchema =
  SchemaFactory.createForClass(EventProposal);
