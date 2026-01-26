import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Link } from './link.entity';

@Entity('analytics_events')
// Match the aggregation index from your SQL for optimized reporting queries
@Index('idx_analytics_aggregation', [
  'link',
  'clickedAt',
  'countryCode',
  'deviceType',
])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string; // BigInt is returned as a string in JS to prevent precision loss

  @Column({ name: 'link_id', type: 'uuid' })
  linkId: string;

  // 2. This handles the relationship logic (FK/Join)
  @Index('idx_analytics_link_time')
  @ManyToOne(() => Link, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'link_id' })
  link: Link;

  // Request Context
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string; // Supports IPv4 and IPv6

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  referer: string;

  // Parsed Analytics
  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string;

  @Column({ name: 'device_type', type: 'varchar', length: 50, nullable: true })
  deviceType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  browser: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  os: string;

  @Index('idx_analytics_clicked_at')
  @CreateDateColumn({ name: 'clicked_at', type: 'timestamp' })
  clickedAt: Date;
}
