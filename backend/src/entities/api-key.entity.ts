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

export enum ApiKeyScope {
  READ = 'read',
  FULL = 'full',
}

export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
}

@Entity('api_key')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  /** Human-readable label e.g. "Production App" */
  @Column({ default: 'Default Key' })
  name: string;

  /** bcrypt hash of the raw API key — never store plain */
  @Column()
  keyHash: string;

  /** First 8 characters of the raw key — used for display/masking */
  @Column({ length: 8 })
  keyPrefix: string;

  @Column({ default: 'full' })
  scope: string; // 'full' or 'read'

  @Column({ default: 'active' })
  status: string; // 'active' or 'revoked'

  @Column({ type: 'bigint', default: 0, transformer: {
    to: (v: number) => v,
    from: (v: string) => parseInt(v, 10) || 0,
  }})
  requestCount: number;

  @Column({ type: 'bigint', default: 0, transformer: {
    to: (v: number) => v,
    from: (v: string) => parseInt(v, 10) || 0,
  }})
  successCount: number;

  @Column({ type: 'bigint', default: 0, transformer: {
    to: (v: number) => v,
    from: (v: string) => parseInt(v, 10) || 0,
  }})
  failCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
