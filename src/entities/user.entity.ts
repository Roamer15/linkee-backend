import { PlanTier } from '../common/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash: string;

  @Column({ name: 'hashed_refresh_token', nullable: true })
  hashedRefreshToken?: string;

  @Index('idx_users_google_id')
  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  googleId?: string;

  @Index('idx_users_api_key')
  @Column({ name: 'api_key', unique: true, length: 64 })
  apiKey: string;

  @Column({
    name: 'plan_tier',
    type: 'enum',
    enum: PlanTier,
    default: PlanTier.FREE,
  })
  planTier: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;
}
