import { Module } from '@nestjs/common';
import { TIME_BLOCK_STORE, PrismaTimeBlockStore } from './time-block.store';
import { TimeBlockService } from './time-block.service';
import { TimeBlockResolver } from './time-block.resolver';

@Module({
  providers: [
    { provide: TIME_BLOCK_STORE, useClass: PrismaTimeBlockStore },
    TimeBlockService,
    TimeBlockResolver,
  ],
})
export class TimeBlockModule {}
