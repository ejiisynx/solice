# Security Specification - Golden Hour Finder

## Data Invariants
1. A **User** profile can only be created with the user's own `uid`.
2. A **Post** must have a `user_id` matching the creator's `uid`.
3. A **Like** can only be created by the authenticated user for themselves.
4. **Journal Entries** are private and can only be read/written by the owner.
5. **Spots** can be read by anyone, but only admins can approve them (initially maybe users can submit but not approve).
6. **Badges** are granted by the system (or logic that checks conditions), but for this MVP, we'll allow users to "earn" them via client logic if we trust the `isValidBadge` helper, but strictly users shouldn't be able to grant themselves "Admin" badges if we had them.
7. **Admin** roles are strictly read-only for users (only manually or via admin tool).

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Creating a post with another user's `userId`.
2. **PII Leak**: Reading another user's `notification_prefs` or `journal`.
3. **Ghost Field Update**: Adding `isAdmin: true` to a user profile update.
4. **State Shortcut**: Setting `approved: true` on a spot submission as a non-admin.
5. **Resource Poisoning**: Using a 2MB string for a post caption.
6. **Orphaned Like**: Liking a post that doesn't exist.
7. **Timestamp Fraud**: Setting `created_at` to a year in the future.
8. **Negative Streak**: Setting `streak_count` to -5.
9. **Bulk Delete**: Attempting to delete all posts in the feed.
10. **ID Injection**: Trying to create a document with ID `../../secrets`.
11. **Verification Bypass**: Writing data without a verified email (if required).
12. **Relational Sync Break**: Posting a comment/like on a post that was just deleted.

## Test Runner Plan
I will implement `firestore.rules` and verify them mentally against these payloads.
The `firestore.rules` will use `isValidUser`, `isValidPost`, etc.
