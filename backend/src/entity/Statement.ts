import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

@Entity()
export class Statement {
  @PrimaryColumn()
  id!: number;

  @Column('decimal', { nullable: false })
  amount!: number;

  @Column({ type: 'date', nullable: false })
  date!: Date;

  @ManyToOne(() => Employee, employee => employee.statements)
  employee!: Employee;
}
