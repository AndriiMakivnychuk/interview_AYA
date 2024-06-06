import { AppDataSource } from '../data-source';
import { Employee } from '../entity/Employee';
import { Department } from '../entity/Department';
import { Statement } from '../entity/Statement';
import { Donation } from '../entity/Donation';
import fs from 'fs';
import readline from 'readline';
import { config } from 'dotenv';

config();

const filePath = process.env.DUMP_FILE_PATH as string;
if (!filePath || typeof filePath !== 'string') {
  console.error('DUMP_FILE_PATH is not defined in the .env file');
  process.exit(1);
}

interface Rate {
  date: Date;
  sign: string;
  value: number;
}

async function parseRates(): Promise<Rate[]> {
  const rates: Rate[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inRatesSection = false;
  let currentRate: Partial<Rate> = {};

  for await (const line of rl) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('Rates')) {
      inRatesSection = true;
      continue;
    }

    if (inRatesSection) {
      if (trimmedLine.startsWith('Rate')) {
        currentRate = {};
      } else if (trimmedLine.startsWith('date:')) {
        currentRate.date = new Date(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.startsWith('sign:')) {
        currentRate.sign = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('value:')) {
        currentRate.value = parseFloat(trimmedLine.split(':')[1].trim());
        rates.push(currentRate as Rate);
      }
    }
  }

  return rates;
}

async function parseFile(rates: Rate[]) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let employeesBatch: Employee[] = [];
  const batchSize = 10000;

  let currentEmployee: Employee | null = null;
  let currentDepartment: Department | null = null;
  let currentStatement: Statement | null = null;
  let currentDonation: Donation | null = null;
  let inDepartmentBlock = false;
  let inStatementBlock = false;
  let inDonationBlock = false;

  const saveCurrentEmployee = () => {
    if (currentEmployee) employeesBatch.push(currentEmployee);
  };

  const handleId = (id: number) => {
    if (inDepartmentBlock && currentDepartment) currentDepartment.id = id;
    else if (inStatementBlock && currentStatement) currentStatement.id = id;
    else if (inDonationBlock && currentDonation) currentDonation.id = id;
    else if (currentEmployee && !currentEmployee.id) currentEmployee.id = id;
  };

  const handleAmount = (amountParts: string[]) => {
    const amount = parseFloat(amountParts[0]);
    const currency = amountParts.length > 1 ? amountParts[1] : 'USD';
    if (inStatementBlock && currentStatement) currentStatement.amount = amount;
    else if (inDonationBlock && currentDonation) {
      const date = currentDonation.date;
      const rate = rates.find(r => r.sign === currency && r.date.getTime() <= date.getTime());
      currentDonation.amount = rate ? amount / rate.value : amount;
    }
  };

  const handleDate = (date: Date) => {
    if (inStatementBlock && currentStatement) currentStatement.date = date;
    else if (inDonationBlock && currentDonation) currentDonation.date = date;
  };

  for await (const line of rl) {
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    if (trimmedLine.startsWith('Rates')) break;

    if (trimmedLine.startsWith('Employee')) {
      saveCurrentEmployee();
      currentEmployee = new Employee();
      currentEmployee.statements = [];
      currentEmployee.donations = [];
      currentDepartment = null;
      currentStatement = null;
      currentDonation = null;
      inDepartmentBlock = false;
      inStatementBlock = false;
      inDonationBlock = false;
    } else if (trimmedLine.startsWith('Department')) {
      currentDepartment = new Department();
      if (currentEmployee) currentEmployee.department = currentDepartment;
      inDepartmentBlock = true;
      inStatementBlock = false;
      inDonationBlock = false;
    } else if (trimmedLine.startsWith('Salary')) {
      inDepartmentBlock = false;
      inStatementBlock = true;
      inDonationBlock = false;
    } else if (trimmedLine.startsWith('Donation')) {
      currentDonation = new Donation();
      if (currentEmployee) {
        currentDonation.employee = currentEmployee;
        currentEmployee.donations.push(currentDonation);
      }
      inDepartmentBlock = false;
      inStatementBlock = false;
      inDonationBlock = true;
    } else if (trimmedLine.startsWith('Statement')) {
      currentStatement = new Statement();
      if (currentEmployee) {
        currentStatement.employee = currentEmployee;
        currentEmployee.statements.push(currentStatement);
      }
      inDepartmentBlock = false;
      inStatementBlock = true;
      inDonationBlock = false;
    } else if (trimmedLine.startsWith('id:')) {
      handleId(parseInt(trimmedLine.split(':')[1].trim()));
    } else if (trimmedLine.startsWith('name:')) {
      const name = trimmedLine.split(':')[1].trim();
      if (inDepartmentBlock && currentDepartment) currentDepartment.name = name;
      else if (currentEmployee) currentEmployee.name = name;
    } else if (trimmedLine.startsWith('surname:')) {
      if (currentEmployee) currentEmployee.surname = trimmedLine.split(':')[1].trim();
    } else if (trimmedLine.startsWith('amount:')) {
      handleAmount(trimmedLine.split(':')[1].trim().split(' '));
    } else if (trimmedLine.startsWith('date:')) {
      handleDate(new Date(trimmedLine.split(':')[1].trim()));
    }

    if (employeesBatch.length >= batchSize) {
      await saveBatch(employeesBatch);
      employeesBatch = [];
    }
  }

  saveCurrentEmployee();

  if (employeesBatch.length > 0) {
    await saveBatch(employeesBatch);
  }
}

async function saveBatch(employees: Employee[]) {
  const employeeRepository = AppDataSource.getRepository(Employee);
  const departmentRepository = AppDataSource.getRepository(Department);
  const statementRepository = AppDataSource.getRepository(Statement);
  const donationRepository = AppDataSource.getRepository(Donation);

  try {
    for (const employee of employees) {
      if (employee.department) {
        await departmentRepository.save(employee.department);
      }

      await employeeRepository.save(employee);

      for (const statement of employee.statements) {
        await statementRepository.save(statement);
      }

      for (const donation of employee.donations) {
        await donationRepository.save(donation);
      }
    }
  } catch (error) {
    console.error('Error saving batch:', error);
  }
}

async function main() {
  await AppDataSource.initialize();
  const rates = await parseRates();

  if (rates.length > 0) {
    await parseFile(rates);
    console.log('Data imported successfully');
  } else {
    console.error('No rates found. Import aborted.');
  }

  process.exit(0);
}

main().catch(error => console.error(error));
