import { deduplicateSongs, verifyNoDuplicates } from '../src/lib/dedupe.js';

console.log('🧪 Testing Deduplication & Verification Logic...');

// Sample dataset with duplicate ID and duplicate Title+Artist pair
const mockRawSongs = [
  { id: '101', title: 'Kesariya (From "Brahmastra")', artist: 'Arijit Singh, Pritam', language: 'Hindi' },
  { id: '102', title: 'Kesariya', artist: 'Arijit Singh', language: 'Hindi' }, // Duplicate pair!
  { id: '101', title: 'Kesariya Remastered', artist: 'Arijit Singh', language: 'Hindi' }, // Duplicate ID!
  { id: '103', title: 'Tum Hi Ho', artist: 'Arijit Singh', language: 'Hindi' },
  { id: '104', title: 'Chaleya', artist: 'Anirudh Ravichander, Arijit Singh', language: 'Hindi' },
];

// 1. Run deduplication
const { uniqueSongs } = deduplicateSongs(mockRawSongs);

console.log(`Original songs count: ${mockRawSongs.length}`);
console.log(`Deduplicated count: ${uniqueSongs.length}`);

if (uniqueSongs.length !== 3) {
  console.error('❌ Deduplication failed! Expected 3 unique songs, got:', uniqueSongs.length);
  process.exit(1);
}

// 2. Verify no duplicates in unique list
try {
  verifyNoDuplicates(uniqueSongs, 'TestOutput');
  console.log('✅ verifyNoDuplicates passed successfully for deduplicated list!');
} catch (err: any) {
  console.error('❌ Verification check failed:', err.message);
  process.exit(1);
}

// 3. Confirm verifyNoDuplicates throws error if given duplicates
let threwAsExpected = false;
try {
  verifyNoDuplicates(mockRawSongs, 'RawDuplicatesInput');
} catch (e) {
  threwAsExpected = true;
  console.log('✅ verifyNoDuplicates correctly detected duplicates and threw error as expected.');
}

if (!threwAsExpected) {
  console.error('❌ verifyNoDuplicates failed to detect duplicates in raw list!');
  process.exit(1);
}

console.log('🎉 All Deduplication Automated Checks Passed!');
