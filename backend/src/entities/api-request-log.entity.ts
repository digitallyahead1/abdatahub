import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('api_request_log')
@Index(['apiKeyId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class ApiRequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  apiKeyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column()
  endpoint: string;

  @Column({ length: 10 })
  method: string;

  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ type: 'int', nullable: true })
  responseTimeMs: number | null;

  /** Hashed/anonymised — last 3 octets zeroed */
  @Column({ nullable: true })
  ipAddress: string | null;

  @Column({ nullable: true })
  errorCode: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ApiKey, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'apiKeyId' })
  apiKey: ApiKey;
}
