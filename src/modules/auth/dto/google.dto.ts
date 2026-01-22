import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GoogleUserDto {
  @IsString()
  googleId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  accessToken: string;
}
