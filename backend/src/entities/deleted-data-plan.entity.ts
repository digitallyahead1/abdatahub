import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('deleted_data_plan')
@Unique(['smeplugPlanId', 'provider'])
export class DeletedDataPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  smeplugPlanId: number;

  @Column({ default: 'smeplug' })
  provider: string; // 'smeplug', 'swiftbills', 'danmalama'

  @Column({ nullable: true })
  network: string; // mtn, airtel, glo, 9mobile

  @Column({ nullable: true })
  bundleName: string;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  costPrice: number;

  @Column({ nullable: true })
  deletedBy: string;

  @CreateDateColumn()
  deletedAt: Date;
}
