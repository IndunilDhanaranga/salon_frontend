# Push notification persistence

Push delivery is independent of signing in and fetching notification history. The browser subscription must stay in server storage while the app is closed.

The Next.js server sends Web Push using the existing VAPID keys. Laravel (`salon_api`) stores devices, subscriptions and broadcast history in the central database's `notification_records` table. Closing the app or expiring a login does not remove these rows. Only explicit unsubscribe or a push provider's HTTP 404/410 response removes a subscription. Removal checks the failed endpoint so it cannot delete a newer subscription.

## Deploy both projects

1. Deploy the backend files in `salon_api` and run `php artisan migrate --force`. The new migration adds `notification_records`; it does not modify salon data.
2. Set the same random, private `NOTIFICATION_STORE_TOKEN` (at least 32 characters) on Laravel and Next.js. A matching local value was configured in the backend `.env` and the frontend's ignored `.env.local`. Set this value in the hosting environment too. Run `php artisan config:cache` after setting the backend value.
3. Keep `LARAVEL_API_URL` pointing to the deployed backend (currently `https://salon-api.wasmer.app/api/v1/`). Production requires database storage and never silently falls back to a temporary JSON file when the API is unavailable.
4. Keep `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` stable across deployments. Set the public key before building Next.js. Existing browser subscriptions are bound to that key pair.
5. Import the existing local records with `node scripts/import-notifications.cjs` after the backend is deployed and its token is configured. An optional argument supplies another saved JSON file. Existing database records take precedence, including renewals that race the import. The original file is preserved.
6. Deploy/restart Next.js. Open the installed app once on each phone to activate the updated worker and save its background renewal context.

The service worker stores the device ID and public VAPID key in CacheStorage, shared with the page. On subscription changes it sends the current endpoint with that ID, and schedules a Background Sync retry where supported. Foreground setup also reconciles on app resume and network reconnection. A failed server save returns a pending result rather than reporting subscription success.

## Verify on a phone

Use HTTPS. On iPhone/iPad use the app installed to the Home Screen with notification permission enabled. Subscribe, close the app, send a platform broadcast, and verify the OS notification appears. Repeat after a frontend/server restart and after locking the phone. The broadcast response's `webPushSent` and `deliveredTo` count push-provider acceptances; they do not prove the phone displayed the notification. Inspect `webPushFailed` for provider failures. Notification history after login is a separate API fetch and does not prove background push delivery.

Automated coverage: `node --test tests/push-notifications.test.cjs` and, in `salon_api`, `php artisan test --filter=NotificationStoreTest`. Real phone background delivery still requires the deployment check above.

Without `NOTIFICATION_STORE_TOKEN`, local development alone can use `.device-notifications-store.json` (or `NOTIFICATION_STORE_FILE`). This file mode is intended for a single local server, not concurrent production instances.
