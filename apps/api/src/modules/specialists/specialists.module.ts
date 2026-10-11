import { Module } from '@nestjs/common';
import { SharedPrismaModule } from '../../shared/prisma/prisma.module';
import { SpecialistsResolver } from './specialists.resolver';
import { SpecialistsService } from './specialists.service';

@Module({
  imports: [SharedPrismaModule],
  providers: [SpecialistsService, SpecialistsResolver],
})
export class SpecialistsModule {}
