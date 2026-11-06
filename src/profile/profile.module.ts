import { Module } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { ExperienceResolver, ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';

@Module({
  providers: [ProfileRepository, ProfileService, ProfileResolver, ExperienceResolver],
  exports: [ProfileRepository],
})
export class ProfileModule {}
