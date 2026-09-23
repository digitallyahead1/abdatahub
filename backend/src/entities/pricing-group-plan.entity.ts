import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PricingGroup } from './pricing-group.entity';
import { DataPlan } from './data-plan.entity';

@Entity('pricing_group_plan')
@Unique(['groupId', 'planId']) // One price override per group per plan
export class PricingGroupPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'uuid' })
  planId: string;

  /** The custom price this group pays for this plan */
  @Column({ type: 'decimal', precision: 20, scale: 2, transformer: {
    to: (v: number) => v,
    from: (v: string) => parseFloat(v) || 0,
  }})
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PricingGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: PricingGroup;

  @ManyToOne(() => DataPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: DataPlan;
}
