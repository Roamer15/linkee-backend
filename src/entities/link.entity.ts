import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('links')
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_links_short_code', { unique: true })
  @Column({ name: 'short_code', length: 10, unique: true })
  shortCode: string;

  @Column({ name: 'original_url', type: 'text' })
  originalUrl: string;

  // We'll need to create the Workspace entity later,
  // for now, let's keep the ID as a string or a placeholder
  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Index('idx_links_expires_at')
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ length: 500, nullable: true })
  title?: string;

  @Column({ name: 'qr_code_url', type: 'text', nullable: true })
  qrCodeUrl: string;

  @Column({ name: 'click_count', type: 'bigint', default: 0 })
  clickCount: number;

  @Column({ name: 'last_clicked_at', type: 'timestamp', nullable: true })
  lastClickedAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
