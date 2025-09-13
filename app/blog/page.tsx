// app/blog/page.tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BlogListPage.module.css'; // <-- নতুন CSS ফাইল ইম্পোর্ট করা হয়েছে

export default function BlogPage() {
  const blogDir = 'blogs';
  const files = fs.readdirSync(path.join(process.cwd(), blogDir));

  // পোস্টগুলোকে তারিখ অনুযায়ী সাজানো (নতুন থেকে পুরোনো)
  const posts = files.map(filename => {
    const slug = filename.replace(/\.(md|mdx)$/, '');
    const markdownWithMeta = fs.readFileSync(path.join(blogDir, filename), 'utf-8');
    const { data: frontmatter } = matter(markdownWithMeta);

    return {
      slug,
      frontmatter,
    };
  }).sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        {/* --- কার্যকরী সমাধান: নতুন SEO-বান্ধব শিরোনাম --- */}
        <h1 className={styles.pageTitle}>GoBike Kids E-Bike Blog</h1>
        <p className={styles.pageSubtitle}>
          Expert tips, safety guides, and inspiring stories for your little rider's next big adventure.
        </p>
      </header>
      
      <main>
        <div className={styles.postsGrid}>
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.postCard}>
              
              {/* --- কার্যকরী সমাধান: কভার ইমেজ --- */}
              <div className={styles.imageContainer}>
                {post.frontmatter.cover_image && (
                  <Image
                    src={post.frontmatter.cover_image}
                    alt={post.frontmatter.title}
                    fill
                    className={styles.postImage}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
              </div>

              <div className={styles.contentContainer}>
                <h2 className={styles.postTitleCard}>{post.frontmatter.title}</h2>
                <p className={styles.postMeta}>
                  By {post.frontmatter.author} on {post.frontmatter.date}
                </p>
                <p className={styles.postExcerpt}>{post.frontmatter.excerpt}</p>
                <span className={styles.readMore}>Read More →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );