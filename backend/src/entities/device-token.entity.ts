import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('device_token')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Index({ unique: true })
  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'varchar', length: 20, default: 'android' })
  platform: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceModel: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  appVersion: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;
}
