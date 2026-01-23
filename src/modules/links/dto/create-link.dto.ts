import {
  IsUrl,
  IsString,
  IsOptional,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateLinkDto {
  @IsUrl({}, { message: 'Please provide a valid destination URL' })
  originalUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  customCode?: string; // Users can suggest their own code

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
