// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthService } from './auth.service';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { User } from '../../entities/user.entity';
// import { Repository } from 'typeorm';
// import { JwtService } from '@nestjs/jwt';
// import { LoggerService } from '../../logger/logger.service';
// import {
//   ConflictException,
//   NotFoundException,
//   UnauthorizedException,
//   BadRequestException,
// } from '@nestjs/common';
// import * as bcrypt from 'bcrypt';
// import { CreateUserDto } from './dto/create-user.dto';
// import { LoginUserDto } from './dto/login-user.dto';
// import { GoogleUserDto } from './dto/google.dto';

// // Mock bcrypt
// jest.mock('bcrypt');

// describe('AuthService', () => {
//   let service: AuthService;
//   const userRepository = {
//     findOne: jest.fn(),
//     save: jest.fn(),
//     create: jest.fn(),
//     update: jest.fn(),
//   } as jest.Mocked<Repository<User>>;

//   let jwtService: jest.Mocked<JwtService>;
//   const loggerService = {
//     log: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn(),
//   } as jest.Mocked<LoggerService>;

//   const mockUser: User = {
//     id: '123e4567-e89b-12d3-a456-426614174000',
//     name: 'John Doe',
//     email: 'john@example.com',
//     passwordHash: 'hashedPassword123',
//     apiKey: 'test-api-key-123',
//     planTier: 'free',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     lastLogin: new Date(),
//     hashedRefreshToken: '',
//     googleId: '',
//   };

//   const mockUserRepository: jest.Mocked<Partial<Repository<User>>> = {
//     findOne: jest.fn(),
//     create: jest.fn(),
//     save: jest.fn(),
//     update: jest.fn(),
//   };

//   const mockJwtService = {
//     signAsync: jest.fn(),
//   };

//   const mockLoggerService = {
//     log: jest.fn(),
//     error: jest.fn(),
//     warn: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: getRepositoryToken(User),
//           useValue: mockUserRepository,
//         },
//         {
//           provide: JwtService,
//           useValue: mockJwtService,
//         },
//         {
//           provide: LoggerService,
//           useValue: mockLoggerService,
//         },
//       ],
//     }).compile();

//     service = module.get<AuthService>(AuthService);
//     userRepository = module.get(getRepositoryToken(User));
//     jwtService = module.get(JwtService);
//     loggerService = module.get(LoggerService);

//     // Reset mocks before each test
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('createUser', () => {
//     const createUserDto: CreateUserDto = {
//       name: 'John Doe',
//       email: 'john@example.com',
//       password: 'password123',
//     };

//     it('should create a new user successfully', async () => {
//       // Arrange
//       userRepository.findOne.mockResolvedValueOnce(null); // No existing user
//       userRepository.findOne.mockResolvedValueOnce(null); // No API key collision
//       userRepository.create.mockReturnValue(mockUser);
//       userRepository.save.mockResolvedValue(mockUser);
//       (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

//       // Act
//       const result = await service.createUser(createUserDto);

//       // Assert
//       expect(result).toEqual(mockUser);
//       expect(userRepository.findOne.bind(userRepository)).toHaveBeenCalledWith({
//         where: { email: createUserDto.email },
//       });
//       expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
//       expect(userRepository.create.bind(userRepository)).toHaveBeenCalledWith({
//         name: createUserDto.name,
//         email: createUserDto.email,
//         passwordHash: 'hashedPassword123',
//         apiKey: expect.toString(),
//       });
//       expect(userRepository.save.bind(userRepository)).toHaveBeenCalledWith(
//         mockUser,
//       );
//       expect(loggerService.log.bind(loggerService)).toHaveBeenCalled();
//     });

//     it('should throw ConflictException if email already exists', async () => {
//       // Arrange
//       userRepository.findOne.mockResolvedValue(mockUser);

//       // Act & Assert
//       await expect(service.createUser(createUserDto)).rejects.toThrow(
//         ConflictException,
//       );
//       expect(loggerService.error.bind('error')).toHaveBeenCalledWith(
//         `Email ${createUserDto.email} already in use`,
//       );
//     });

//     it('should retry if API key collision occurs', async () => {
//       // Arrange
//       userRepository.findOne
//         .mockResolvedValueOnce(null) // No existing email
//         .mockResolvedValueOnce(mockUser) // First API key exists
//         .mockResolvedValueOnce(null); // Second API key is unique

//       userRepository.create.mockReturnValue(mockUser);
//       userRepository.save.mockResolvedValue(mockUser);
//       (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

//       // Act
//       const result = await service.createUser(createUserDto);

//       // Assert
//       expect(result).toEqual(mockUser);
//       expect(userRepository.findOne.bind(userRepository)).toHaveBeenCalledTimes(
//         3,
//       ); // 1 email + 2 API key checks
//       expect(loggerService.warn.bind('log')).toHaveBeenCalled();
//     });
//   });

//   describe('loginUser', () => {
//     const loginUserDto: LoginUserDto = {
//       email: 'john@example.com',
//       password: 'password123',
//     };

//     it('should login user successfully and return tokens', async () => {
//       // Arrange
//       const tokens = {
//         access_token: 'access-token-123',
//         refresh_token: 'refresh-token-456',
//       };

//       userRepository.findOne.mockResolvedValue(mockUser);
//       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
//       (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
//       jwtService.signAsync
//         .mockResolvedValueOnce(tokens.access_token)
//         .mockResolvedValueOnce(tokens.refresh_token);

//       // Act
//       const result = await service.loginUser(loginUserDto);

//       // Assert
//       expect(result).toEqual(tokens);
//       expect(userRepository.findOne.bind(userRepository)).toHaveBeenCalledWith({
//         where: { email: loginUserDto.email },
//       });
//       expect(bcrypt.compare).toHaveBeenCalledWith(
//         loginUserDto.password,
//         mockUser.passwordHash,
//       );
//       expect(jwtService.signAsync.bind(jwtService)).toHaveBeenCalledTimes(2);
//       expect(userRepository.update.bind(User)).toHaveBeenCalledWith(
//         mockUser.id,
//         {
//           hashedRefreshToken: 'hashedRefreshToken',
//         },
//       );
//       expect(userRepository.update.bind(userRepository)).toHaveBeenCalledWith(
//         mockUser.id,
//         {
//           lastLogin: expect.any(Date) as unknown as Date,
//         },
//       );
//     });

//     it('should throw NotFoundException if user does not exist', async () => {
//       // Arrange
//       userRepository.findOne.mockResolvedValue(null);

//       // Act & Assert
//       await expect(service.loginUser(loginUserDto)).rejects.toThrow(
//         NotFoundException,
//       );
//       expect(loggerService.log.bind(loggerService)).toHaveBeenCalledWith(
//         `Email doesn't exist`,
//       );
//     });

//     it('should throw UnauthorizedException if password is incorrect', async () => {
//       // Arrange
//       userRepository.findOne.mockResolvedValue(mockUser);
//       (bcrypt.compare as jest.Mock).mockResolvedValue(false);

//       // Act & Assert
//       await expect(service.loginUser(loginUserDto)).rejects.toThrow(
//         UnauthorizedException,
//       );
//       expect(loggerService.log.bind(loggerService)).toHaveBeenCalledWith(
//         'Wrong password',
//       );
//     });

//     it('should throw UnauthorizedException if user has no password (Google user)', async () => {
//       // Arrange
//       const googleUser = { ...mockUser, passwordHash: '' };
//       userRepository.findOne.mockResolvedValue(googleUser);

//       // Act & Assert
//       await expect(service.loginUser(loginUserDto)).rejects.toThrow(
//         UnauthorizedException,
//       );
//       expect(bcrypt.compare).not.toHaveBeenCalled();
//     });
//   });

//   describe('googleLogin', () => {
//     const googleUserDto: GoogleUserDto = {
//       googleId: 'google-id-123',
//       email: 'john@example.com',
//       firstName: 'John',
//       lastName: 'Doe',
//       accessToken: 'raueuhbfhbsfbsncybdfusncrec.wfugsd78chr7eh87sdyhf7egf7sdgf',
//     };

//     it('should create a new user for first-time Google login', async () => {
//       // Arrange
//       const tokens = {
//         access_token: 'access-token-123',
//         refresh_token: 'refresh-token-456',
//       };

//       userRepository.findOne.mockResolvedValue(null); // No existing user
//       userRepository.create.mockReturnValue({
//         ...mockUser,
//         googleId: googleUserDto.googleId,
//       });
//       userRepository.save.mockResolvedValue({
//         ...mockUser,
//         googleId: googleUserDto.googleId,
//       });
//       (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
//       jwtService.signAsync
//         .mockResolvedValueOnce(tokens.access_token)
//         .mockResolvedValueOnce(tokens.refresh_token);

//       // Act
//       const result = await service.googleLogin(googleUserDto);

//       // Assert
//       expect(result).toEqual(tokens);
//       expect(userRepository.findOne.bind(userRepository)).toHaveBeenCalledWith({
//         where: [
//           { googleId: googleUserDto.googleId },
//           { email: googleUserDto.email },
//         ],
//       });
//       expect(userRepository.create.bind(userRepository)).toHaveBeenCalledWith({
//         email: googleUserDto.email,
//         name: 'John Doe',
//         googleId: googleUserDto.googleId,
//         apiKey: expect.any(String) as unknown as string,
//       });
//       expect(userRepository.save.bind(userRepository)).toHaveBeenCalled();
//       expect(loggerService.log.bind(loggerService)).toHaveBeenCalledWith(
//         `New Google user created: ${googleUserDto.email}`,
//       );
//     });

//     it('should link Google account to existing email user', async () => {
//       // Arrange
//       const existingUser = { ...mockUser, googleId: '' };
//       const tokens = {
//         access_token: 'access-token-123',
//         refresh_token: 'refresh-token-456',
//       };

//       userRepository.findOne.mockResolvedValue(existingUser);
//       userRepository.save.mockResolvedValue({
//         ...existingUser,
//         googleId: googleUserDto.googleId,
//       });
//       (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
//       jwtService.signAsync
//         .mockResolvedValueOnce(tokens.access_token)
//         .mockResolvedValueOnce(tokens.refresh_token);

//       // Act
//       const result = await service.googleLogin(googleUserDto);

//       // Assert
//       expect(result).toEqual(tokens);
//       expect(userRepository.save.bind(userRepository)).toHaveBeenCalledWith({
//         ...existingUser,
//         googleId: googleUserDto.googleId,
//       });
//       expect(loggerService.log.bind(loggerService)).toHaveBeenCalledWith(
//         `Linked existing account to Google: ${googleUserDto.email}`,
//       );
//     });

//     it('should login existing Google user', async () => {
//       // Arrange
//       const existingGoogleUser = {
//         ...mockUser,
//         googleId: googleUserDto.googleId,
//       };
//       const tokens = {
//         access_token: 'access-token-123',
//         refresh_token: 'refresh-token-456',
//       };

//       userRepository.findOne.mockResolvedValue(existingGoogleUser);
//       (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
//       jwtService.signAsync
//         .mockResolvedValueOnce(tokens.access_token)
//         .mockResolvedValueOnce(tokens.refresh_token);

//       // Act
//       const result = await service.googleLogin(googleUserDto);

//       // Assert
//       expect(result).toEqual(tokens);
//       expect(userRepository.create.bind(userRepository)).not.toHaveBeenCalled(); // Should not create new user
//       expect(userRepository.update.bind(userRepository)).toHaveBeenCalledWith(
//         existingGoogleUser.id,
//         {
//           hashedRefreshToken: 'hashedRefreshToken',
//         },
//       );
//     });

//     it('should throw BadRequestException if googleUser is null', async () => {
//       // Act & Assert
//       await expect(service.googleLogin(null)).rejects.toThrow(
//         BadRequestException,
//       );
//     });
//   });

//   describe('logoutUser', () => {
//     it('should clear refresh token on logout', async () => {
//       // Arrange
//       const userId = mockUser.id;
//       // userRepository.update.mockResolvedValue(undefined);

//       // Act
//       await service.logoutUser(userId);

//       // Assert
//       expect(userRepository.update.bind(userRepository)).toHaveBeenCalledWith(
//         userId,
//         {
//           hashedRefreshToken: '',
//         },
//       );
//       expect(loggerService.log.bind(loggerService)).toHaveBeenCalledWith(
//         `Cleared refresh token for user ${userId}`,
//       );
//     });
//   });
// });
