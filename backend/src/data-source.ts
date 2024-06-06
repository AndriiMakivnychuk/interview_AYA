import { DataSource } from 'typeorm';
import { Employee } from './entity/Employee';
import { Department } from './entity/Department';
import { Statement } from './entity/Statement';
import { Donation } from './entity/Donation';


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'admin',
  password: '1234',
  database: 'employeedb',
  synchronize: true,
  logging: false,
  entities: [Employee, Department, Statement, Donation],
  migrations: ['src/migration/**/*.ts'],
  subscribers: [],
});
