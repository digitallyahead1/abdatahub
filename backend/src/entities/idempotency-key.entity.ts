import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('idempotency_key')
@Index(['userId', 'key'], { unique: true })
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The client-provided idempotency key value */
  @Column()
  key: string;

  @Column({ type: 'uuid' })
  userId: string;

  /** Cached response body — returned on duplicate requests */
  @Column({ type: 'jsonb', nullable: true })
  response: any;

  /** HTTP status code of the original response */
  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  /** Keys expire after 24h */
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
