import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  STUDENT_SCROLL_CONTAINER_SELECTOR,
  getActiveStudentScrollContainer,
  getPageScrollY,
  scrollPageToTop,
  scrollPageToY,
  subscribePageScroll,
} from '../utils/scrollContainer';

const rootDir = path.resolve(process.cwd());

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

// 1. CSS safe-area & docked viewport tokens
const indexCss = readSource('src/index.css');
assert.match(
  indexCss,
  /--sdn-dock-safe-area:\s*calc\(108px \+ env\(safe-area-inset-bottom, 0px\)\)/,
  'src/index.css must define mobile --sdn-dock-safe-area with safe-area-inset-bottom'
);
assert.match(
  indexCss,
  /--sdn-dock-safe-area:\s*calc\(92px \+ env\(safe-area-inset-bottom, 0px\)\)/,
  'src/index.css must define desktop --sdn-dock-safe-area with safe-area-inset-bottom'
);
assert.match(
  indexCss,
  /\.student-scroll-viewport\s*\{/,
  'src/index.css must define .student-scroll-viewport'
);
assert.match(
  indexCss,
  /\.student-bottom-nav-tray\s*\{[\s\S]*?height:\s*var\(--sdn-dock-safe-area\)/,
  'src/index.css must reserve --sdn-dock-safe-area height in .student-bottom-nav-tray'
);
assert.match(
  indexCss,
  /\.student-scroll-viewport\s+\.dashboard-main-scroll\s*\{[\s\S]*?padding-bottom:\s*calc\(48px \+ env\(safe-area-inset-bottom, 0px\)\)/,
  'src/index.css must provide extra bottom breathing padding inside .student-scroll-viewport .dashboard-main-scroll'
);

// 2. DashboardShell and AppLayout dock safe-area structure
for (const shellPath of [
  'src/components/dashboard/DashboardShell.tsx',
  'src/components/layout/AppLayout.tsx',
]) {
  const source = readSource(shellPath);
  assert.match(
    source,
    /hasDockedBottomNav/,
    `${shellPath} must compute hasDockedBottomNav`
  );
  assert.match(
    source,
    /h-\[100dvh\]\s+overflow-hidden/,
    `${shellPath} must constrain viewport height when docked bottom nav is active`
  );
  assert.match(
    source,
    /data-student-scroll-container="true"/,
    `${shellPath} must render the dedicated student scroll container`
  );
  assert.match(
    source,
    /data-bottom-nav-safe-area="true"/,
    `${shellPath} must render the non-overlapping bottom nav safe-area tray`
  );
  assert.match(
    source,
    /student-bottom-nav-tray/,
    `${shellPath} must apply .student-bottom-nav-tray class`
  );
}

// 3. Key student scroll integrations use the shared scrollContainer helper
for (const consumerPath of [
  'src/components/ui/ScrollToTop.tsx',
  'src/pages/commons/CommonsFeedPage.tsx',
  'src/components/profile/ProfileView.tsx',
  'src/pages/store/StorePage.tsx',
]) {
  const source = readSource(consumerPath);
  assert.match(
    source,
    /scrollContainer/,
    `${consumerPath} must integrate with scrollContainer helpers`
  );
}

// 4. scrollContainer helpers behave safely in SSR/Node environments without window/document
assert.equal(
  STUDENT_SCROLL_CONTAINER_SELECTOR,
  '[data-student-scroll-container="true"]'
);
assert.equal(getActiveStudentScrollContainer(), null);
assert.equal(getPageScrollY(), 0);
assert.doesNotThrow(() => scrollPageToY(120, 'auto'));
assert.doesNotThrow(() => scrollPageToTop('smooth'));
const unsub = subscribePageScroll(() => {});
assert.doesNotThrow(() => unsub());

console.log('studentBottomNavLayout tests passed!');
