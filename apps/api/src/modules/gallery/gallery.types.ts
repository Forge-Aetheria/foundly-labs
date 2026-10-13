import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

/** A photo in a business's gallery (feature 012). `order` maps to the persisted display order. */
@ObjectType()
export class GalleryItem {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  url!: string;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Int)
  order!: number;
}

@InputType()
export class AddGalleryItemInput {
  @Field(() => String)
  url: string;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  category?: string | null;

  constructor() {
    this.url = '';
  }
}
