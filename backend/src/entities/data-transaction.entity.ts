import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('data_transaction')
export class DataTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  network: string; // mtn, airtel, glo, 9mobile

  @Column()
  planId: string; // SMEPlug Plan ID

  @Column()
  bundleName: string;

  /** Recipient phone number */
  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  smeplugCost: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  sellingPrice: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  profit: number; // sellingPrice - costPrice

  @Column({ unique: true })
  transactionReference: string;

  /** Provider's own transaction/order ID */
  @Column({ type: 'varchar', nullable: true })
  providerTransactionId: string | null;

  /** Full raw response payload from the provider */
  @Column({ type: 'jsonb', nullable: true })
  providerResponse: any;

  /** Human-readable failure reason, if status=failed */
  @Column({ type: 'varchar', nullable: true })
  failureReason: string | null;

  /** Which API key triggered this transaction (null = web/dashboard purchase) */
  @Column({ type: 'uuid', nullable: true })
  apiKeyId: string | null;

  @Column({ default: 'pending' })
  status: string; // pending, processing, success, failed, refunded

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
