import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../subscription/subscription.module';
import { CATALOG_STORE, PrismaCatalogStore } from './catalog.store';
import { CatalogService } from './catalog.service';
import { CatalogResolver } from './catalog.resolver';

@Module({
  imports: [SubscriptionModule],
  providers: [
    { provide: CATALOG_STORE, useClass: PrismaCatalogStore },
    CatalogService,
    CatalogResolver,
  ],
})
export class CatalogModule {}