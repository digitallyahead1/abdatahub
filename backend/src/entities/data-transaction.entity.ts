import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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

  @Column({ default: 'pending' })
  status: string; // success, failed, pending

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
