import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

@Entity()
export class Donation {
  @PrimaryColumn()
  id!: number;

  @Column({ type: 'date', nullable: false })
  date!: Date;

  @Column('decimal', { nullable: false })
  amount!: number;  // This will store the amount in USD

  @ManyToOne(() => Employee, employee => employee.donations)
  employee!: Employee;
}
