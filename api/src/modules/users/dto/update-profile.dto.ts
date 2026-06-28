import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Used by PATCH /users/me. A user's account already exists in PENDING
 * status the moment they complete OAuth (see AuthService.validateOAuthUser) —
 * this endpoint just lets them attach the city they want alerts for and an
 * optional note, which is what the "Request Access" screen in the UI submits.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  requestNote?: string;
}
