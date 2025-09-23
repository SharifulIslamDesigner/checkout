// app/blog/[slug]/page.tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import styles from './SingleBlogPage.module.css'; // <-- নতুন CSS ফাইল ইম্পোর্ট করা হয়েছে
import Breadcrumbs from '../../../components/Breadcrumbs';

export async function generateStaticParams() {
  const files = fs.readdirSync(path.join('blogs'));
  const paths = files.map(filename => ({
    slug: filename.replace(/\.(md|mdx)$/, ''), // .md এবং .mdx উভয়ই সমর্থন করে
  }));
  return paths;
}

function getPostContent(slug: string) {
    const filePath = path.join('blogs', `${slug}.md`); // .mdx এর জন্যও লজিক যোগ করা যেতে পারে
    const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(markdownWithMeta);
    return { frontmatter, content };
}

export default function SingleBlogPage({ params }: { params: { slug: string } }) {
  const { frontmatter, content } = getPostContent(params.slug);

  return (
    <div>
      <Breadcrumbs />
    <article className={styles.articleContainer}>
      <header className={styles.postHeader}>
        
        <h1 className={styles.postTitle}>{frontmatter.title}</h1>
        <p className={styles.postMeta}>By {frontmatter.author} on {frontmatter.date}</p>
      </header>

      {frontmatter.cover_image && (
        <Image 
            src={frontmatter.cover_image}
            alt={frontmatter.title}
            width={800}
            height={400}
            className={styles.coverImage}
            style={{objectFit: 'cover'}}
            priority
        />
      )}
      
      <div className={styles.postContent}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </article>
    </div>
  );
}