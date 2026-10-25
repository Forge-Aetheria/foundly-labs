import { EMPTY_GALLERY_DRAFT, buildGalleryInput, validateGalleryDraft } from '../gallery-form';
import { galleryCategoryLabel } from '../categories';

describe('gallery form helpers', () => {
  it('requires a valid http(s) URL', () => {
    expect(validateGalleryDraft(EMPTY_GALLERY_DRAFT).url).toBeDefined();
    expect(validateGalleryDraft({ ...EMPTY_GALLERY_DRAFT, url: 'ftp://img' }).url).toBeDefined();
    expect(
      validateGalleryDraft({ ...EMPTY_GALLERY_DRAFT, url: 'https://cdn.test/photo.jpg' }),
    ).toEqual({});
  });

  it('normalizes optional values to null', () => {
    expect(
      buildGalleryInput({
        url: ' https://cdn.test/photo.jpg ',
        title: ' ',
        description: 'Trabajo',
        category: '',
      }),
    ).toEqual({
      url: 'https://cdn.test/photo.jpg',
      title: null,
      description: 'Trabajo',
      category: null,
    });
  });

  it('maps gallery category labels', () => {
    expect(galleryCategoryLabel('trabajos')).toBe('Trabajos');
    expect(galleryCategoryLabel('otra')).toBe('otra');
    expect(galleryCategoryLabel(null)).toBeNull();
  });
});
