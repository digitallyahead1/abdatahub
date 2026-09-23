import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export const WEBHOOK_EVENTS = [
  'data.purchase.success',
  'data.purchase.failed',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

@Entity('webhook_endpoint')
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  /** Optional: scope to a specific API key */
  @Column({ type: 'uuid', nullable: true })
  apiKeyId: string | null;

  /** Human-readable label */
  @Column({ default: 'My Webhook' })
  label: string;

  /** The target URL we POST to */
  @Column()
  url: string;

  /** HMAC-SHA256 secret — shown once on creation */
  @Column()
  secret: string;

  /** Events this endpoint subscribes to */
  @Column({ type: 'text', array: true, default: ['data.purchase.success', 'data.purchase.failed'] })
  events: string[];

  @Column({ default: 'active' })
  status: string; // 'active' | 'disabled'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
