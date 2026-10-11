import { Injectable } from '@nestjs/common';
import { prisma } from '@foundly/database';

/** Injectable wrapper over the shared Prisma client (single persistence seam). */
@Injectable()
export class PrismaService {
  readonly client = prisma;
}
