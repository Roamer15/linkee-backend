import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { GoogleUserDto } from '../dto/google.dto';

interface Name {
  givenName: string;
  familyName: string;
}

interface Email {
  value: string;
}

interface ProfileData {
  name: Name;
  id: string;
  emails: Email[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy as any,
  'google',
) {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: ProfileData,
  ): GoogleUserDto {
    const { name, emails, id } = profile;

    const user: GoogleUserDto = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      accessToken,
    };
    return user;
  }
}
