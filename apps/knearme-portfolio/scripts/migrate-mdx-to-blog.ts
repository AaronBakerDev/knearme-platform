#!/usr/bin/env npx tsx
/**
 * Migration Script: MDX Articles → Payload CMS Blog
 *
 * Migrates all MDX files from /content/learn/ to Payload CMS Articles collection.
 * Part of the Blog Content Consolidation plan.
 *
 * Usage:
 *   npx tsx scripts/migrate-mdx-to-blog.ts
 *
 * What it does:
 * 1. Reads all MDX files from /content/learn/
 * 2. Parses frontmatter and markdown content
 * 3. Converts markdown to Lexical JSON format
 * 4. Creates articles in Payload CMS with:
 *    - Preserved slugs (filename)
 *    - Mapped categories
 *    - SEO metadata
 *    - Status: published
 *
 * Prerequisites:
 * - DATABASE_URL in .env.local pointing to Supabase
 * - Categories will be auto-created if missing
 * - Default author will be auto-created if missing
 *
 * @see .claude/plans/jolly-coalescing-feather.md (Blog Content Consolidation Plan)
 */

import { config } from 'dotenv'
import { resolve, basename } from 'path'
import { readFileSync, readdirSync } from 'fs'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') })

// Verify DATABASE_URL is loaded before proceeding
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  console.error('Please ensure DATABASE_URL is set to your Supabase connection string')
  process.exit(1)
}

console.log('✓ DATABASE_URL loaded, connecting to:', new URL(process.env.DATABASE_URL).host)

// Types for parsed MDX content
interface MdxFrontmatter {
  title: string
  description: string
  category: string
  author?: string
  publishedAt: string
  updatedAt?: string
  readingTime?: number
  featured?: boolean
  image?: string
  tags?: string[]
  relatedServices?: string[]
  pillarSlug?: string
  faqs?: Array<{ question: string; answer: string }>
}

interface MdxArticle {
  slug: string
  frontmatter: MdxFrontmatter
  content: string
  rawContent: string
}

// Category mapping from MDX category values to Payload category slugs
const CATEGORY_MAP: Record<string, string> = {
  costs: 'cost-guides',
  'cost-guides': 'cost-guides',
  'how-to': 'how-to',
  howto: 'how-to',
  maintenance: 'maintenance',
  comparisons: 'comparisons',
  comparison: 'comparisons',
  'hiring-tips': 'hiring-tips',
  hiring: 'hiring-tips',
  guide: 'how-to',
  guides: 'how-to',
}

/**
 * Lexical Node Types
 * These match Payload's Lexical editor expected format.
 */
interface LexicalTextNode {
  type: 'text'
  text: string
  format?: number
  version: 1
}

interface LexicalParagraphNode {
  type: 'paragraph'
  children: LexicalNode[]
  direction: 'ltr' | 'rtl' | null
  format: '' | 'left' | 'center' | 'right' | 'justify'
  indent: number
  version: 1
}

interface LexicalHeadingNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: LexicalNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  version: 1
}

interface LexicalListNode {
  type: 'list'
  listType: 'bullet' | 'number'
  children: LexicalListItemNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  start: number
  tag: 'ul' | 'ol'
  version: 1
}

interface LexicalListItemNode {
  type: 'listitem'
  children: LexicalNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  value: number
  version: 1
}

interface LexicalLinkNode {
  type: 'link'
  children: LexicalNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  version: 2
  fields: {
    linkType: 'custom'
    url: string
    newTab: boolean
  }
}

interface LexicalQuoteNode {
  type: 'quote'
  children: LexicalNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  version: 1
}

interface LexicalCodeNode {
  type: 'code'
  children: LexicalNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  language: string
  version: 1
}

interface LexicalTableNode {
  type: 'table'
  children: LexicalTableRowNode[]
  version: 1
}

interface LexicalTableRowNode {
  type: 'tablerow'
  children: LexicalTableCellNode[]
  version: 1
}

interface LexicalTableCellNode {
  type: 'tablecell'
  children: LexicalNode[]
  headerState: number
  colSpan: number
  rowSpan: number
  version: 1
}

type LexicalNode =
  | LexicalTextNode
  | LexicalParagraphNode
  | LexicalHeadingNode
  | LexicalListNode
  | LexicalListItemNode
  | LexicalLinkNode
  | LexicalQuoteNode
  | LexicalCodeNode
  | LexicalTableNode
  | LexicalTableRowNode
  | LexicalTableCellNode

interface LexicalRoot {
  root: {
    children: LexicalNode[]
    direction: 'ltr' | 'rtl' | null
    format: ''
    indent: number
    type: 'root'
    version: 1
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MdastNode = any

/**
 * Convert markdown AST (MDAST) to Lexical JSON format.
 */
function mdastToLexical(mdast: MdastNode): LexicalRoot {
  const children = processNodes(mdast.children || [])
  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function processNodes(nodes: MdastNode[]): LexicalNode[] {
  const result: LexicalNode[] = []
  for (const node of nodes) {
    const converted = convertNode(node)
    if (converted) {
      if (Array.isArray(converted)) {
        result.push(...converted)
      } else {
        result.push(converted)
      }
    }
  }
  return result
}

function convertNode(node: MdastNode): LexicalNode | LexicalNode[] | null {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node)
    case 'heading':
      return convertHeading(node)
    case 'list':
      return convertList(node)
    case 'listItem':
      return convertListItem(node)
    case 'blockquote':
      return convertBlockquote(node)
    case 'code':
      return convertCode(node)
    case 'table':
      return convertTable(node)
    case 'thematicBreak':
      return null
    case 'html':
      if (node.value) {
        return {
          type: 'paragraph',
          children: [{ type: 'text', text: node.value, version: 1 }],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        }
      }
      return null
    default:
      return null
  }
}

function convertParagraph(node: MdastNode): LexicalParagraphNode {
  return {
    type: 'paragraph',
    children: convertInlineNodes(node.children || []),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function convertHeading(node: MdastNode): LexicalHeadingNode {
  const depth = Math.min(6, Math.max(1, node.depth || 2))
  return {
    type: 'heading',
    tag: `h${depth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    children: convertInlineNodes(node.children || []),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function convertList(node: MdastNode): LexicalListNode {
  const ordered = node.ordered || false
  return {
    type: 'list',
    listType: ordered ? 'number' : 'bullet',
    children: (node.children || []).map((item: MdastNode, index: number) =>
      convertListItem(item, index + 1)
    ) as LexicalListItemNode[],
    direction: 'ltr',
    format: '',
    indent: 0,
    start: node.start || 1,
    tag: ordered ? 'ol' : 'ul',
    version: 1,
  }
}

function convertListItem(node: MdastNode, value: number = 1): LexicalListItemNode {
  const children: LexicalNode[] = []
  for (const child of node.children || []) {
    if (child.type === 'paragraph') {
      children.push(...convertInlineNodes(child.children || []))
    } else if (child.type === 'list') {
      children.push(convertList(child))
    } else {
      const converted = convertNode(child)
      if (converted) {
        if (Array.isArray(converted)) {
          children.push(...converted)
        } else {
          children.push(converted)
        }
      }
    }
  }
  return {
    type: 'listitem',
    children: children.length > 0 ? children : [{ type: 'text', text: '', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    value,
    version: 1,
  }
}

function convertBlockquote(node: MdastNode): LexicalQuoteNode {
  const children: LexicalNode[] = []
  for (const child of node.children || []) {
    if (child.type === 'paragraph') {
      children.push(...convertInlineNodes(child.children || []))
    }
  }
  return {
    type: 'quote',
    children: children.length > 0 ? children : [{ type: 'text', text: '', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function convertCode(node: MdastNode): LexicalCodeNode {
  return {
    type: 'code',
    children: [{ type: 'text', text: node.value || '', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    language: node.lang || '',
    version: 1,
  }
}

function convertTable(node: MdastNode): LexicalTableNode {
  const rows: LexicalTableRowNode[] = []
  for (let i = 0; i < (node.children || []).length; i++) {
    const rowNode = node.children[i]
    if (rowNode.type === 'tableRow') {
      rows.push(convertTableRow(rowNode, i === 0))
    }
  }
  return {
    type: 'table',
    children: rows,
    version: 1,
  }
}

function convertTableRow(node: MdastNode, isHeader: boolean): LexicalTableRowNode {
  const cells: LexicalTableCellNode[] = []
  for (const cellNode of node.children || []) {
    if (cellNode.type === 'tableCell') {
      cells.push(convertTableCell(cellNode, isHeader))
    }
  }
  return {
    type: 'tablerow',
    children: cells,
    version: 1,
  }
}

function convertTableCell(node: MdastNode, isHeader: boolean): LexicalTableCellNode {
  return {
    type: 'tablecell',
    children: convertInlineNodes(node.children || []),
    headerState: isHeader ? 1 : 0,
    colSpan: 1,
    rowSpan: 1,
    version: 1,
  }
}

function convertInlineNodes(nodes: MdastNode[]): LexicalNode[] {
  const result: LexicalNode[] = []
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        result.push({ type: 'text', text: node.value || '', version: 1 })
        break
      case 'strong':
        for (const child of node.children || []) {
          if (child.type === 'text') {
            result.push({ type: 'text', text: child.value || '', format: 1, version: 1 })
          } else {
            result.push(...convertInlineNodes([child]))
          }
        }
        break
      case 'emphasis':
        for (const child of node.children || []) {
          if (child.type === 'text') {
            result.push({ type: 'text', text: child.value || '', format: 2, version: 1 })
          } else {
            result.push(...convertInlineNodes([child]))
          }
        }
        break
      case 'link':
        result.push({
          type: 'link',
          children: convertInlineNodes(node.children || []),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 2,
          fields: {
            linkType: 'custom',
            url: node.url || '',
            newTab: (node.url || '').startsWith('http'),
          },
        })
        break
      case 'inlineCode':
        result.push({ type: 'text', text: node.value || '', version: 1 })
        break
      default:
        if (node.value) {
          result.push({ type: 'text', text: node.value, version: 1 })
        }
    }
  }
  return result.length > 0 ? result : [{ type: 'text', text: '', version: 1 }]
}

function markdownToLexical(markdown: string): LexicalRoot {
  const processor = unified().use(remarkParse).use(remarkGfm)
  const mdast = processor.parse(markdown)
  return mdastToLexical(mdast)
}

function readMdxFiles(): MdxArticle[] {
  const contentDir = resolve(process.cwd(), 'content/learn')
  const files = readdirSync(contentDir).filter((f) => f.endsWith('.mdx'))

  return files.map((filename) => {
    const filePath = resolve(contentDir, filename)
    const rawContent = readFileSync(filePath, 'utf-8')
    const { data, content } = matter(rawContent)
    return {
      slug: basename(filename, '.mdx'),
      frontmatter: data as MdxFrontmatter,
      content: content.trim(),
      rawContent,
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateAuthor(payload: any): Promise<{ id: string | number }> {
  const existingAuthors = await payload.find({
    collection: 'authors',
    where: { name: { equals: 'KnearMe Team' } },
    limit: 1,
  })

  if (existingAuthors.docs.length > 0) {
    return { id: existingAuthors.docs[0].id }
  }

  console.log('📝 Creating default author: KnearMe Team')
  const newAuthor = await payload.create({
    collection: 'authors',
    data: {
      name: 'KnearMe Team',
      slug: 'knearme-team',
      bio: 'The KnearMe editorial team provides expert guidance on masonry, home improvement, and contractor selection.',
    },
  })

  return { id: newAuthor.id }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateCategories(payload: any): Promise<Map<string, string | number>> {
  const categoryMap = new Map<string, string | number>()

  const categories = [
    { slug: 'cost-guides', name: 'Cost Guides', description: 'Pricing information for homeowners' },
    { slug: 'how-to', name: 'How-To Guides', description: 'DIY instructions and measurement guides' },
    { slug: 'maintenance', name: 'Maintenance', description: 'Preventive care and damage signs' },
    { slug: 'comparisons', name: 'Comparisons', description: 'X vs Y educational content' },
    { slug: 'hiring-tips', name: 'Hiring Tips', description: 'Choosing contractors wisely' },
  ]

  for (const cat of categories) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      categoryMap.set(cat.slug, existing.docs[0].id)
      console.log(`  ✓ Found category: ${cat.name}`)
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: cat,
      })
      categoryMap.set(cat.slug, created.id)
      console.log(`  ✓ Created category: ${cat.name}`)
    }
  }

  return categoryMap
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migrateArticle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  article: MdxArticle,
  authorId: string | number,
  categoryMap: Map<string, string | number>
): Promise<boolean> {
  const { slug, frontmatter, content } = article

  console.log(`\n📄 Migrating: ${slug}`)

  try {
    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  ⚠️ Article already exists, skipping: ${slug}`)
      return true
    }

    const lexicalContent = markdownToLexical(content)
    const mdxCategory = (frontmatter.category || 'how-to').toLowerCase()
    const categorySlug = CATEGORY_MAP[mdxCategory] || 'how-to'
    const categoryId = categoryMap.get(categorySlug)

    await payload.create({
      collection: 'articles',
      data: {
        title: frontmatter.title,
        slug,
        excerpt: frontmatter.description?.substring(0, 160) || '',
        content: lexicalContent,
        author: authorId,
        category: categoryId,
        publishedAt: frontmatter.publishedAt
          ? new Date(frontmatter.publishedAt).toISOString()
          : new Date().toISOString(),
        status: 'published',
        seo: {
          metaTitle: frontmatter.title,
          metaDescription: frontmatter.description,
        },
      },
    })

    console.log(`  ✅ Created article: ${frontmatter.title}`)
    return true
  } catch (error) {
    console.error(`  ❌ Failed to migrate ${slug}:`, error)
    return false
  }
}

/**
 * Main migration function - uses dynamic import to ensure env vars are loaded first.
 */
async function migrateMdxToBlog() {
  console.log('🚀 Starting MDX to Blog Migration\n')
  console.log('='.repeat(60))

  try {
    // Dynamic import of Payload after env vars are loaded
    console.log('\n📦 Loading Payload CMS...')
    const { getPayload } = await import('payload')
    const payloadConfigModule = await import('../src/payload/payload.config.js')
    const payloadConfig = payloadConfigModule.default

    console.log('📦 Initializing Payload CMS...')
    const payload = await getPayload({ config: payloadConfig })

    console.log('\n👤 Setting up author...')
    const author = await getOrCreateAuthor(payload)
    console.log(`  ✓ Author ID: ${author.id}`)

    console.log('\n📁 Setting up categories...')
    const categoryMap = await getOrCreateCategories(payload)

    console.log('\n📂 Reading MDX files...')
    const articles = readMdxFiles()
    console.log(`  Found ${articles.length} MDX files to migrate`)

    console.log('\n' + '='.repeat(60))
    console.log('Starting article migration...')
    console.log('='.repeat(60))

    let success = 0
    let failed = 0

    for (const article of articles) {
      const result = await migrateArticle(payload, article, author.id, categoryMap)
      if (result) {
        success++
      } else {
        failed++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('Migration Complete!')
    console.log('='.repeat(60))
    console.log(`  ✅ Successful: ${success}`)
    console.log(`  ❌ Failed: ${failed}`)
    console.log(`  📊 Total: ${articles.length}`)

    if (failed === 0) {
      console.log('\n🎉 All articles migrated successfully!')
      console.log('Next steps:')
      console.log('  1. Verify articles at /admin → Articles')
      console.log('  2. Test blog routes at /blog')
      console.log('  3. Add redirects and delete /learn route')
    }

    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateMdxToBlog()
