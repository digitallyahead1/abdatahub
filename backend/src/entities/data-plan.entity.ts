import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('data_plan')
export class DataPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  smeplugPlanId: number;

  @Column({ nullable: true })
  provider: string; // 'smeplug' or 'amzaet'. NULL is treated as 'smeplug'

  @Column()
  network: string; // mtn, airtel, glo, 9mobile

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

  @Column({ default: false })
  overrideStatus: boolean; // true = admin override active

  @Column({ default: true })
  visibilityStatus: boolean; // true = visible to customers

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
