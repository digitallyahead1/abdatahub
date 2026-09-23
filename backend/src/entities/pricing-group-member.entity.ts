import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PricingGroup } from './pricing-group.entity';
import { User } from './user.entity';

@Entity('pricing_group_member')
@Unique(['userId']) // A user can only be in ONE group at a time
export class PricingGroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  addedAt: Date;

  @ManyToOne(() => PricingGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: PricingGroup;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
