import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255, { message: 'Maximum length is 255 characters' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MaxLength(100)
  @MinLength(2)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\\[\]|\\:;"'<>,.?/~`]).{8,60}$/,
  )
  password: string;
}
