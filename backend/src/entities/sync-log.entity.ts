import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sync_log')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  syncTime: Date;

  @Column({ default: 0 })
  totalPlansAdded: number;

  @Column({ default: 0 })
  totalPlansUpdated: number;

  @Column({ default: 0 })
  totalPlansDisabled: number;

  @Column()
  syncStatus: string; // success, failed

  @Column({ type: 'text', nullable: true })
  errorMessage: string;
}
