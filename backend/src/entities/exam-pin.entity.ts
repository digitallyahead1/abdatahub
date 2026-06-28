import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ExamCategory } from './exam-category.entity';

@Entity('exam_pin')
export class ExamPin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  pinCode: string;

  @Column({ type: 'varchar', nullable: true })
  serialNumber: string | null;

  @Column()
  examType: string; // references ExamCategory id

  @Column({ default: false })
  isSold: boolean;

  @Column({ type: 'uuid', nullable: true })
  soldToUserId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  soldAt: Date | null;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  amountPaid: number | null;

  @Column({ default: 'available' })
  status: string; // 'available', 'sold', 'disabled'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'soldToUserId' })
  soldToUser: User | null;

  @ManyToOne(() => ExamCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examType' })
  category: ExamCategory;
}
