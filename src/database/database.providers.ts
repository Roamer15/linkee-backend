import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres', // Changed from 'mysql'
        host: 'localhost',
        port: 5432, // Default Postgres port
        username: 'postgres', // Default Postgres user is usually 'postgres'
        password: '557Py2mjs8.',
        database: 'linkee_db',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // Set to false in production to avoid data loss!
        synchronize: false,
        logging: process.env.NODE_ENV === 'developmernt',
      });

      return dataSource.initialize();
    },
  },
];
