import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('wallet_transaction')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @Column()
  type: string; // 'credit', 'debit'

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  previousBalance: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  newBalance: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;
}
