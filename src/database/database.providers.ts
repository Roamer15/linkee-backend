import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10) || 5432, // Default Postgres port
        username: process.env.DB_USER, // Default Postgres user is usually 'postgres'
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // Set to false in production to avoid data loss!
        synchronize: process.env.NODE_ENV === 'development' ? true : false,
        logging: process.env.NODE_ENV === 'development',
      });

      return dataSource.initialize();
    },
  },
];
