import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('push_notification_log')
export class PushNotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 50, default: 'all' })
  targetType: string; // 'all' | 'agents' | 'user' | 'topic'

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetValue: string | null;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ type: 'jsonb', nullable: true })
  dataPayload: Record<string, any> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sentBy: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
