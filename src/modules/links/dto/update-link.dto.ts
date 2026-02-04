import { IsUrl, IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateLinkDto {
  @IsUrl({}, { message: 'Please provide a valid destination URL' })
  @IsOptional()
  originalUrl?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
