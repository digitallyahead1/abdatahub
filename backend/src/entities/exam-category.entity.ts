import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('exam_category')
export class ExamCategory {
  @PrimaryColumn()
  id: string; // e.g. 'waec', 'neco', 'jamb', 'nbais', 'nabteb'

  @Column()
  name: string; // e.g. 'WAEC Result Checker', 'NECO Token Checker'

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  price: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0
  }})
  agentPrice: number;

  @Column({ default: 'active' })
  status: string; // 'active', 'disabled'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
