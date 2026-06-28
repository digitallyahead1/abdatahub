import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('airtime_transaction')
export class AirtimeTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  network: string; // mtn, airtel, glo, 9mobile

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  amount: number; // Face value amount (e.g. 1000)

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  smeplugCost: number; // Cost charged by SMEPlug (amount * cost rate)

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  sellingPrice: number; // Price charged to user (amount * selling rate)

  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  profit: number; // sellingPrice - costPrice

  @Column({ unique: true })
  transactionReference: string;

  @Column({ default: 'pending' })
  status: string; // success, failed, pending

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
