import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('system_setting')
export class SystemSetting {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  mtnMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 15 })
  airtelMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  gloMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  mobile9Margin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100 })
  utilityFee: number;

  @Column({ type: 'varchar', length: 50, default: 'simulated' })
  activeGateway: string;

  // Service Fee Configuration
  @Column({ type: 'boolean', default: true })
  serviceFeeEnabled: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000 })
  serviceFeeMinAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 20000 })
  serviceFeeMaxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 30 })
  serviceFeeAmount: number;

  // Notification Popup
  @Column({ type: 'boolean', default: false })
  notificationEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  notificationMessage: string | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
