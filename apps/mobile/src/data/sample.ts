/**
 * Sample content for the UI until the API exists. Shapes follow the domain model in the spec
 * (pages with blocks, collections, tags, books, highlights, journal entries) so screens can
 * switch to real data with minimal changes.
 */

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted_list'
  | 'numbered_list'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'link';

export type Block = {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
};

export type Collection = {
  id: string;
  name: string;
};

export type Page = {
  id: string;
  title: string;
  collectionId: string;
  parentId?: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  editedLabel: string;
  blocks: Block[];
};

export type ReadingStatus = 'want_to_read' | 'reading' | 'finished';

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover: { background: string; foreground: string };
  status: ReadingStatus;
  progress?: number;
  rating?: number;
  startedLabel?: string;
  finishedLabel?: string;
};

export type Highlight = {
  id: string;
  bookId: string;
  chapter: string;
  pageNumber: number;
  text: string;
  note?: string;
  linkedPageId?: string;
};

export type JournalEntry = {
  id: string;
  /** 0 = today, 1 = yesterday, … Keeps the sample week aligned with the device date. */
  daysAgo: number;
  title: string;
  learned: string;
  challenges: string;
  reflection: string;
};

export const sampleUser = { name: 'Sridhar' };

export const collections: Collection[] = [
  { id: 'c-system-design', name: 'System Design' },
  { id: 'c-interview', name: 'Interview Prep' },
  { id: 'c-reading', name: 'Reading' },
];

export const pages: Page[] = [
  {
    id: 'p-distributed',
    title: 'Distributed systems',
    collectionId: 'c-system-design',
    tags: ['architecture'],
    favorite: true,
    archived: false,
    editedLabel: 'Today',
    blocks: [
      { id: 'b1', type: 'paragraph', content: 'Index of notes on building reliable distributed systems.' },
    ],
  },
  {
    id: 'p-consistent-hashing',
    title: 'Consistent hashing',
    collectionId: 'c-system-design',
    parentId: 'p-distributed',
    tags: ['databases', 'scaling'],
    favorite: false,
    archived: false,
    editedLabel: '2h ago',
    blocks: [
      { id: 'b1', type: 'heading2', content: 'Why it matters' },
      {
        id: 'b2',
        type: 'paragraph',
        content:
          'When a node joins or leaves, only about 1/n of the keys move instead of nearly all of them.',
      },
      { id: 'b3', type: 'bulleted_list', content: 'Place nodes and keys on the same hash ring' },
      { id: 'b4', type: 'bulleted_list', content: 'Use virtual nodes to even out the load' },
      { id: 'b5', type: 'todo', content: 'Read the Dynamo paper', checked: true },
      { id: 'b6', type: 'todo', content: 'Compare with rendezvous hashing', checked: false },
      { id: 'b7', type: 'code', content: 'const node = ring.successor(hash(key));' },
    ],
  },
  {
    id: 'p-raft',
    title: 'Raft consensus',
    collectionId: 'c-system-design',
    parentId: 'p-distributed',
    tags: ['consensus'],
    favorite: false,
    archived: false,
    editedLabel: '3 days ago',
    blocks: [
      { id: 'b1', type: 'paragraph', content: 'Leader election, log replication and safety.' },
    ],
  },
  {
    id: 'p-partitioning',
    title: 'Partitioning strategies',
    collectionId: 'c-system-design',
    parentId: 'p-distributed',
    tags: ['databases'],
    favorite: false,
    archived: false,
    editedLabel: 'Last week',
    blocks: [
      {
        id: 'b1',
        type: 'paragraph',
        content: 'Range vs hash partitioning, and when each one wins.',
      },
    ],
  },
  {
    id: 'p-graphs',
    title: 'Graph traversal patterns',
    collectionId: 'c-interview',
    tags: ['algorithms'],
    favorite: true,
    archived: false,
    editedLabel: 'Yesterday',
    blocks: [
      { id: 'b1', type: 'heading2', content: 'BFS' },
      { id: 'b2', type: 'paragraph', content: 'Shortest path on unweighted graphs.' },
      { id: 'b3', type: 'heading2', content: 'DFS' },
      { id: 'b4', type: 'paragraph', content: 'Cycle detection, topological sort, components.' },
    ],
  },
  {
    id: 'p-ideas',
    title: 'Ideas inbox',
    collectionId: 'c-reading',
    tags: [],
    favorite: false,
    archived: false,
    editedLabel: '2 weeks ago',
    blocks: [{ id: 'b1', type: 'paragraph', content: '' }],
  },
  {
    id: 'p-old-notes',
    title: 'Old interview notes',
    collectionId: 'c-interview',
    tags: [],
    favorite: false,
    archived: true,
    editedLabel: 'Last year',
    blocks: [{ id: 'b1', type: 'paragraph', content: '' }],
  },
];

export const books: Book[] = [
  {
    id: 'bk-ddia',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    description: '[Your description of the book]',
    cover: { background: '#22314A', foreground: '#F2EEE4' },
    status: 'reading',
    progress: 0.64,
    rating: 4,
    startedLabel: '2 Oct 2026',
  },
  {
    id: 'bk-pragmatic',
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    description: '[Your description of the book]',
    cover: { background: '#7A2E1F', foreground: '#F6E9DC' },
    status: 'reading',
    progress: 0.22,
    startedLabel: '18 Oct 2026',
  },
  {
    id: 'bk-clean-architecture',
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    description: '[Your description of the book]',
    cover: { background: '#2F5D50', foreground: '#EAF2EC' },
    status: 'finished',
    rating: 4,
    finishedLabel: 'Sep 2026',
  },
  {
    id: 'bk-deep-work',
    title: 'Deep Work',
    author: 'Cal Newport',
    description: '[Your description of the book]',
    cover: { background: '#1C1B19', foreground: '#F2F1EE' },
    status: 'finished',
    rating: 5,
    finishedLabel: 'Aug 2026',
  },
  {
    id: 'bk-atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: '[Your description of the book]',
    cover: { background: '#E9D8A6', foreground: '#3B2F12' },
    status: 'want_to_read',
  },
];

export const highlights: Highlight[] = [
  {
    id: 'h1',
    bookId: 'bk-ddia',
    chapter: 'Chapter 6 · Partitioning',
    pageNumber: 203,
    text: '[Highlighted passage — the text you saved from the book appears here.]',
    note: 'This is why hot keys need a salt suffix. Try it on the activity feed.',
    linkedPageId: 'p-consistent-hashing',
  },
  {
    id: 'h2',
    bookId: 'bk-ddia',
    chapter: 'Chapter 5 · Replication',
    pageNumber: 161,
    text: '[Another saved passage about replication lag.]',
  },
  {
    id: 'h3',
    bookId: 'bk-pragmatic',
    chapter: 'Topic 9 · DRY',
    pageNumber: 30,
    text: '[A saved passage about duplication of knowledge.]',
  },
];

export const journalEntries: JournalEntry[] = [
  {
    id: 'j-today',
    daysAgo: 0,
    title: 'Virtual nodes',
    learned:
      'Virtual nodes smooth out load on a hash ring, and the number of vnodes is a tuning knob.',
    challenges: 'How do I rebalance without a thundering herd on the new node?',
    reflection: '',
  },
  {
    id: 'j-2',
    daysAgo: 2,
    title: 'Raft leader election',
    learned: 'Randomised election timeouts prevent split votes.',
    challenges: 'Still unsure how log compaction interacts with snapshots.',
    reflection: 'Drawing the state machine helped more than reading.',
  },
  {
    id: 'j-3',
    daysAgo: 3,
    title: 'BFS vs DFS trade-offs',
    learned: 'Practised 4 problems. BFS for shortest path on unweighted graphs.',
    challenges: '',
    reflection: '',
  },
  {
    id: 'j-5',
    daysAgo: 5,
    title: 'Hash partitioning',
    learned: 'Hash partitioning loses range queries.',
    challenges: '',
    reflection: '',
  },
  {
    id: 'j-6',
    daysAgo: 6,
    title: 'Replication lag',
    learned: 'Read-your-writes needs routing reads to the leader for a while.',
    challenges: '',
    reflection: '',
  },
];

export function findPage(id: string) {
  return pages.find((page) => page.id === id);
}

export function findBook(id: string) {
  return books.find((book) => book.id === id);
}

export function findCollection(id: string) {
  return collections.find((collection) => collection.id === id);
}

export function createId() {
  return Math.random().toString(36).slice(2, 10);
}
