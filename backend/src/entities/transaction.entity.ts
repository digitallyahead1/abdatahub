import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { DateTransformer } from '../common/date.util';

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  type: string; // e.g. 'debit', 'credit'

  @Column()
  service: string; // e.g. 'data', 'airtime', 'electricity', 'cable', 'exam-pin', 'deposit'

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  amount: number;

  @Column({ default: 'pending' })
  status: string; // e.g. 'success', 'failed', 'pending'

  @Column({ unique: true })
  reference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ transformer: DateTransformer })
  createdAt: Date;

  @UpdateDateColumn({ transformer: DateTransformer })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
