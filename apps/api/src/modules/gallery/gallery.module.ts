import { Module } from '@nestjs/common';
import { GALLERY_STORE, PrismaGalleryStore } from './gallery.store';
import { GalleryService } from './gallery.service';
import { GalleryResolver } from './gallery.resolver';

@Module({
  providers: [
    { provide: GALLERY_STORE, useClass: PrismaGalleryStore },
    GalleryService,
    GalleryResolver,
  ],
})
export class GalleryModule {}
