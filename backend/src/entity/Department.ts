import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Employee } from './Employee';

@Entity()
export class Department {
  @PrimaryColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => Employee, employee => employee.department)
  employees!: Employee[];
}
