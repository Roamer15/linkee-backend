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
        password: 'your_password',
        database: 'linkee_db',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // Set to false in production to avoid data loss!
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
