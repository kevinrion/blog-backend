import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'changeme';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      metadata: { displayName: 'Admin' },
    },
  });

  const [nestjsTag, typescriptTag] = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'nestjs' },
      update: {},
      create: { name: 'NestJS', slug: 'nestjs' },
    }),
    prisma.tag.upsert({
      where: { slug: 'typescript' },
      update: {},
      create: { name: 'TypeScript', slug: 'typescript' },
    }),
  ]);

  const welcomePost = await prisma.post.upsert({
    where: { slug: 'welcome-to-the-blog' },
    update: {},
    create: {
      title: 'Welcome to the Blog',
      slug: 'welcome-to-the-blog',
      content:
        'This is a sample post seeded for local development. Replace it with real content as you build out the API.',
      published: true,
      authorId: admin.id,
      metadata: { excerpt: 'Getting started with the blog backend.' },
      tags: {
        create: [{ tagId: nestjsTag.id }, { tagId: typescriptTag.id }],
      },
    },
  });

  const draftPost = await prisma.post.upsert({
    where: { slug: 'draft-post' },
    update: {},
    create: {
      title: 'Draft Post',
      slug: 'draft-post',
      content: 'This post is unpublished and visible only to the author and admins.',
      published: false,
      authorId: admin.id,
      tags: {
        create: [{ tagId: typescriptTag.id }],
      },
    },
  });

  await prisma.comment.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      body: 'Sample comment on the welcome post.',
      postId: welcomePost.id,
      authorId: admin.id,
    },
  });

  console.log('Seed complete.');
  console.log(`  Admin: ${admin.email} (password: ${ADMIN_PASSWORD})`);
  console.log(`  Posts: ${welcomePost.slug}, ${draftPost.slug}`);
  console.log(`  Tags: ${nestjsTag.slug}, ${typescriptTag.slug}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
