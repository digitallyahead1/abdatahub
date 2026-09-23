import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WebhookEndpoint } from './webhook-endpoint.entity';

@Entity('webhook_delivery')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  webhookEndpointId: string;

  /** Event name e.g. data.purchase.success */
  @Column()
  event: string;

  /** Full payload sent */
  @Column({ type: 'jsonb' })
  payload: any;

  /** HTTP status from receiving server (null if network error) */
  @Column({ type: 'integer', nullable: true })
  responseStatus: number | null;

  /** Trimmed response body from receiving server */
  @Column({ type: 'varchar', nullable: true })
  responseBody: string | null;

  /** Attempt number (1 = first try, 2 = first retry, etc.) */
  @Column({ default: 1 })
  attempt: number;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => WebhookEndpoint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhookEndpointId' })
  endpoint: WebhookEndpoint;
}
