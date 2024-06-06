import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Department } from './Department';
import { Statement } from './Statement';
import { Donation } from './Donation';

@Entity()
export class Employee {
  @PrimaryColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  surname!: string;

  @ManyToOne(() => Department, department => department.employees)
  department!: Department;

  @OneToMany(() => Statement, statement => statement.employee)
  statements!: Statement[];

  @OneToMany(() => Donation, donation => donation.employee)
  donations!: Donation[];
}
