import assert from 'node:assert/strict';
import type { AppNotification } from '../services/notificationService';
import {
  NOTIFICATION_FILTER_BUCKETS,
  computeNotificationFilterCounts,
  deduplicateNotifications,
  filterNotificationsByTab,
  resolveNotificationDisplayCategory,
} from '../utils/notificationGrouping';

const toMillisFn = (val: AppNotification['createdAt']): number => {
  if (typeof val === 'number') return val;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

function makeNotif(overrides: Partial<AppNotification> & { id: string }): AppNotification {
  return {
    type: 'following_post',
    title: '',
    message: '',
    createdAt: 1_700_000_000_000,
    read: false,
    ...overrides,
  };
}

// 1. Duplicate "FREE HARVARD COURSE" alerts (different IDs, authorId vs authorName, markdown/URL differences)
{
  const items: AppNotification[] = [
    makeNotif({
      id: 'post_abc123_follower_u1',
      postId: 'abc123',
      type: 'following_post',
      authorId: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
      authorName: 'SHS Virtual Academy',
      title: 'SHS Virtual Academy posted: FREE HARVARD COURSE',
      message:
        'Harvard University is offering free online courses with certificates in CS50 and AI.',
      createdAt: 1_700_000_200_000,
      read: false,
    }),
    makeNotif({
      id: 'fs_legacy_dup_harvard',
      postId: 'xyz789',
      type: 'following_post',
      authorName: 'SHS Virtual Academy',
      title: '*FREE HARVARD COURSE*',
      message:
        '*FREE HARVARD COURSE* Harvard University is offering free online courses with certificates in CS50 and AI. https://pll.harvard.edu/catalog',
      createdAt: 1_700_000_100_000,
      read: true,
    }),
  ];

  const { items: deduped, aliasMap } = deduplicateNotifications(items, {
    userId: 'u1',
    toMillisFn,
  });

  assert.equal(deduped.length, 1, 'Duplicate FREE HARVARD COURSE alerts must collapse into 1');
  assert.equal(deduped[0].id, 'post_abc123_follower_u1', 'Deterministic post ID should be preserved');
  assert.equal(deduped[0].read, true, 'Merged notification preserves read=true if either copy was read');
  const aliases = aliasMap.get(deduped[0].id);
  assert.ok(aliases?.has('fs_legacy_dup_harvard'), 'Alias map tracks merged duplicate ID');
}

// 2. Duplicate Russian Open Doors Scholarship alerts (split across title vs message, leading IMPORTANT label)
{
  const items: AppNotification[] = [
    makeNotif({
      id: 'notif_rus_1',
      postId: 'p_rus_1',
      type: 'following_post',
      authorId: 'A5YMRimdHRcmeDWutxtUGt2e4hf2',
      title: 'IMPORTANT',
      message:
        '*IMPORTANT* Russian Open Doors Scholarship 2026 is now open for international students. Apply at https://od.globaluni.ru',
      createdAt: 1_700_000_300_000,
    }),
    makeNotif({
      id: 'notif_rus_2',
      postId: 'p_rus_2',
      type: 'following_post',
      authorName: 'SHS Virtual Academy',
      title: 'SHS Virtual Academy posted: IMPORTANT: Russian Open Doors Scholarship',
      message: '2026 is now open for international students. Apply today!',
      createdAt: 1_700_000_250_000,
    }),
  ];

  const { items: deduped } = deduplicateNotifications(items, {
    userId: 'u1',
    toMillisFn,
  });

  assert.equal(deduped.length, 1, 'Duplicate Russian scholarship alerts must collapse into 1');
}

// 3. Duplicate FREE HARVARD COURSE when one copy has generic body ("published a new post")
{
  const items: AppNotification[] = [
    makeNotif({
      id: 'n1',
      postId: 'p1',
      type: 'following_post',
      title: 'SHS Virtual Academy posted: FREE HARVARD COURSE',
      message: 'SHS Virtual Academy published a new post in Commons.',
      createdAt: 1_700_000_400_000,
    }),
    makeNotif({
      id: 'n2',
      postId: 'p2',
      type: 'following_post',
      title: 'FREE HARVARD COURSE',
      message: 'Apply for Harvard CS50 and Data Science courses for free.',
      createdAt: 1_700_000_350_000,
    }),
  ];

  const { items: deduped } = deduplicateNotifications(items, {
    userId: 'u1',
    toMillisFn,
  });

  assert.equal(deduped.length, 1, 'Generic-body fanout copy must merge with full-body copy');
}

// 4. Distinct posts with similar subject titles and distinct monthly rewards must NOT be collapsed
{
  const items: AppNotification[] = [
    makeNotif({
      id: 'phys_ch1',
      postId: 'p_ch1',
      type: 'following_post',
      authorId: 'teacher_1',
      title: 'Class 10 Physics',
      message: 'Chapter 1: Simple Harmonic Motion complete lecture notes and MCQs',
      createdAt: 1_700_000_500_000,
    }),
    makeNotif({
      id: 'phys_ch2',
      postId: 'p_ch2',
      type: 'following_post',
      authorId: 'teacher_1',
      title: 'Class 10 Physics',
      message: 'Chapter 2: Sound Waves and Acoustics complete lecture notes and MCQs',
      createdAt: 1_700_000_450_000,
    }),
    makeNotif({
      id: 'rew_oct',
      type: 'reward',
      title: 'Monthly Captain Allotment',
      message: '+5,000 Kobans credited to your account for October 2026',
      createdAt: 1_700_000_400_000,
    }),
    makeNotif({
      id: 'rew_nov',
      type: 'reward',
      title: 'Monthly Captain Allotment',
      message: '+5,000 Kobans credited to your account for November 2026',
      createdAt: 1_700_000_350_000,
    }),
  ];

  const { items: deduped } = deduplicateNotifications(items, {
    userId: 'u1',
    toMillisFn,
  });

  assert.equal(deduped.length, 4, 'Distinct chapters and distinct monthly rewards must remain separate');
}

// 5. Strict mutually-exclusive filter partition: sum of non-All buckets MUST equal All count
{
  const mixedNotifications: AppNotification[] = [
    // Following posts (8 unique)
    ...Array.from({ length: 8 }, (_, idx) =>
      makeNotif({
        id: `post_${idx}`,
        postId: `p_${idx}`,
        type: 'following_post',
        authorId: 'admin_1',
        title: `Unique Study Post #${idx + 1}`,
        message: `Detailed revision guide for subject topic number ${idx + 1}.`,
        createdAt: 1_700_001_000_000 - idx * 1000,
      })
    ),
    // Follower notification (even if current user does NOT follow back)
    makeNotif({
      id: 'follow_user99_u1',
      type: 'new_follower',
      authorId: 'user99',
      authorName: 'Zainab',
      title: 'Zainab started following you',
      message: 'Tap to view profile',
      createdAt: 1_700_000_900_000,
    }),
    // Announcement
    makeNotif({
      id: 'welcome_boardly_v1',
      type: 'announcement',
      isAnnouncement: true,
      announcementId: 'welcome_boardly_v1',
      title: 'Welcome to Boardly',
      message: 'Start practicing with past papers and MCQs.',
      createdAt: 1_700_000_800_000,
    }),
    // Reward & Crew
    makeNotif({
      id: 'reward_1',
      type: 'reward',
      title: 'Kobans Credited',
      message: '+500 Kobans credited for your streak milestone.',
      createdAt: 1_700_000_700_000,
    }),
    makeNotif({
      id: 'crew_1',
      type: 'crew',
      title: 'Welcome to Boardly Crew',
      message: 'Your referral code is CREW-TEST.',
      createdAt: 1_700_000_650_000,
    }),
    // System & Direct Message (previously uncategorised!)
    makeNotif({
      id: 'sys_pro',
      type: 'system',
      title: 'Boardly Pro Activated',
      message: 'Your Pro access is now active.',
      createdAt: 1_700_000_600_000,
    }),
    makeNotif({
      id: 'msg_1',
      type: 'new_message',
      title: 'New message from Bilal',
      message: 'Can you share Chapter 4 notes?',
      createdAt: 1_700_000_550_000,
    }),
  ];

  const counts = computeNotificationFilterCounts(
    mixedNotifications,
    resolveNotificationDisplayCategory
  );

  const bucketSum =
    counts.following + counts.announcements + counts.rewards + counts.system;

  assert.equal(counts.all, 14);
  assert.equal(counts.following, 9, '8 following posts + 1 follower');
  assert.equal(counts.announcements, 1, '1 announcement');
  assert.equal(counts.rewards, 2, '1 reward + 1 crew');
  assert.equal(counts.system, 2, '1 system + 1 direct message');
  assert.equal(
    bucketSum,
    counts.all,
    'Sum of category tab counts must strictly equal All count'
  );

  // Verify disjointness & completeness across filterNotificationsByTab
  const seenIds = new Set<string>();
  for (const bucket of NOTIFICATION_FILTER_BUCKETS) {
    const filtered = filterNotificationsByTab(
      mixedNotifications,
      bucket,
      resolveNotificationDisplayCategory
    );
    assert.equal(
      filtered.length,
      counts[bucket],
      `Filtered length for ${bucket} must equal its badge count`
    );
    for (const item of filtered) {
      assert.ok(
        !seenIds.has(item.id),
        `Notification ${item.id} must belong to strictly one filter category`
      );
      seenIds.add(item.id);
    }
  }
  assert.equal(
    seenIds.size,
    mixedNotifications.length,
    'Every notification in All must appear in exactly one category tab'
  );
}

console.log('All notification grouping & deduplication tests passed!');
