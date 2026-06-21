import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, type Types } from 'mongoose';
import type { TMaps } from 'src/types/maps.types';

export type VlrMapDocument = HydratedDocument<VlrMap>;

@Schema({ collection: 'maps', timestamps: true })
export class VlrMap {
  readonly _id: Types.ObjectId;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  @Prop({ required: true, type: String })
  vlrId: string;

  @Prop({ unique: true, type: String, required: true })
  /**
   * TeamName_MatchId_MapName_
   */
  customId: string;

  @Prop({ required: true, type: String })
  name: TMaps;

  @Prop({
    required: true,
    maxLength: 5,
    minLength: 5,
    type: [String],
  })
  agents: string[];

  @Prop({ required: true, type: String })
  team: string;

  @Prop({ required: true, type: String })
  teamLogoUrl: string;

  @Prop({ required: true, type: Boolean })
  won: boolean;

  @Prop({ default: null, type: String, allowNull: true })
  vodUrl: string | null;

  @Prop({ type: Number, allowNull: true })
  patch: number | null;

  @Prop({ required: true, type: String })
  eventId: string;
}

export const VlrMapSchema =
  SchemaFactory.createForClass(VlrMap);
