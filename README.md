# Documentation

## How to run
So for now it's only backend part I'll share frontend part later you have in /backend folder file .env.example change it into just .env also don't forget to change the path to the file 
**DUMP_FILE_PATH=/home/andrii/interview_AYA/backend/dump.txt** change it to your path
and run:
`cd backend/`
`npm i`
`docker compose up -d`
`npm run start`

## Asnwers to the questions
### Questions

Objective: demonstrate that the design desicions you made were solid by
answering the questions.

1. How to change the code to support different file versions?

   Within file we need to specify file version in the begging. Then we
   need to add a version parser inside our function which will choose the version
   of the file and maybe other startety to work with it.

2. How the import system will change if data on exchange rates disappears from
   the file, and it will need to be received asynchronously (via API)? 
   
   The main concept will be the same but insteat getting rates first from
   the file we will get it from some external API and then will continue file
   parsing

3. In the future the client may want to import files via the web interface,
   how can the system be modified to allow this?

   We need to create a basic UI where user can choose and attach the file. Then we need to 
   create a specific endpoint which will proceed and parse this file in the same way as we'd
   like to do it manually
