import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  emailVerified: boolean;

  @Column({ default: true })
  phoneVerified: boolean;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ unique: true })
  referralCode: string;

  @Column({ type: 'uuid', nullable: true })
  referredBy: string;

  @Column('text', { array: true, default: '{}' })
  permissions: string[];

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockoutUntil: Date | null;

  @Column({ type: 'varchar', nullable: true })
  transactionPin: string | null;

  @Column({ default: 'none' })
  agentStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  agentAppliedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}
