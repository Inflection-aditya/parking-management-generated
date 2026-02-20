import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index
} from 'typeorm';
import { EventStatus } from '../../../domain.types/event.store.types';

///////////////////////////////////////////////////////////////////////////////

@Entity('event_store')
@Index(['Topic', 'EventType'])
@Index(['CompanyId'])
@Index(['CorrelationId'])
@Index(['Status'])
@Index(['CreatedAt'])
export class EventStoreModel {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36, nullable: false })
    EventId: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    Topic: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    EventType: string;

    @Column({ type: 'int', default: 1 })
    Version: number;

    @Column({ type: 'varchar', length: 36, nullable: false })
    CorrelationId: string;

    @Column({ type: 'varchar', length: 36, nullable: true })
    CompanyId: string;

    @Column({ type: 'varchar', length: 36, nullable: true })
    UserId: string;

    @Column({ type: 'text', nullable: false })
    Payload: string;

    @Column({ type: 'text', nullable: true })
    Metadata: string;

    @Column({
        type    : 'varchar',
        length  : 20,
        default : EventStatus.Pending
    })
    Status: EventStatus;

    @Column({ type: 'int', default: 0 })
    RetryCount: number;

    @Column({ type: 'text', nullable: true })
    LastError: string;

    @Column({ type: 'timestamp', nullable: true })
    PublishedAt: Date;

    @CreateDateColumn()
    CreatedAt: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

}
