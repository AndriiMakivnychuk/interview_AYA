import 'reflect-metadata';
import express from 'express';
import { json } from 'body-parser';
import { AppDataSource } from './data-source';
import { Employee } from './entity/Employee';

const app = express();
app.use(json());

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });

    // API endpoint to calculate the reward
    app.get('/api/rewards', async (req, res) => {
      try {
        const rewards = await AppDataSource.getRepository(Employee)
          .createQueryBuilder('employee')
          .leftJoinAndSelect('employee.donations', 'donation')
          .select([
            'employee.id AS employee_id',
            'employee.name AS employee_name',
            'employee.surname AS employee_surname',
            'SUM(donation.amount) AS total_donated',
            `CASE 
              WHEN SUM(donation.amount) > 100 THEN 
                (SUM(donation.amount) / (
                  SELECT SUM(d.amount) 
                  FROM donation d 
                  WHERE d.amount > 100
                )) * 10000
              ELSE 0
            END AS reward`
          ])
          .groupBy('employee.id')
          .having('SUM(donation.amount) > 0')
          .orderBy('reward', 'DESC')
          .getRawMany(); 
        res.json(rewards);
      } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).send('Internal Server Error');
      }
    });

  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
