import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('airtime_pricing')
export class AirtimePricing {
  @PrimaryColumn()
  network: string; // mtn, airtel, glo, 9mobile (acts as primary key)

  @Column({ type: 'decimal', precision: 5, scale: 4, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  smeplugRate: number; // cost percentage rate (e.g. 0.97 for 3% discount)

  @Column({ type: 'decimal', precision: 5, scale: 4, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  sellingRate: number; // rate customer pays (e.g. 0.99 for 1% discount)

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 1.0000, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  agentRate: number; // rate approved agents pay

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
