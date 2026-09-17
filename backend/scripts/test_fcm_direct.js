/**
 * Direct FCM test: sends a push notification to ONE real token via Firebase Admin SDK
 * using the service account from backend/src/config/firebase-service-account.json
 * 
 * Run: node scripts/test_fcm_direct.js <fcm_token>
 * Example: node scripts/test_fcm_direct.js "czPEC8Ur..."
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../src/config/firebase-service-account.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
  console.log('Loaded service account for project:', serviceAccount.project_id);
  console.log('Client email:', serviceAccount.client_email);
} catch (e) {
  console.error('Failed to load service account:', e.message);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Get a real FCM token from command line or use the most recent one from the script output
const testToken = process.argv[2] || 'czPEC8UrSI2YtUvpiou8aU:APA91bEu6vxJzcA7L';

if (!testToken || testToken.length < 10) {
  console.error('Please provide a valid FCM token as argument');
  process.exit(1);
}

console.log('\nSending test notification to token (prefix):', testToken.substring(0, 40), '...');

async function sendTest() {
  try {
    const message = {
      token: testToken,
      notification: {
        title: 'FCM Direct Test',
        body: 'If you see this, push notifications are working!',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'ab_data_hub_alerts',
        },
      },
      data: {
        title: 'FCM Direct Test',
        body: 'Test message',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    };

    const result = await admin.messaging().send(message);
    console.log('\n✅ SUCCESS! Message ID:', result);
    console.log('Push notification was delivered successfully by FCM!');
  } catch (err) {
    console.error('\n❌ FAILED:', err.message);
    console.error('Error code:', err.errorInfo?.code);
    console.error('HTTP error code:', err.errorInfo?.httpStatusCode);
    
    if (err.errorInfo?.code === 'messaging/registration-token-not-registered') {
      console.log('\n→ Token is STALE/EXPIRED — the device has unregistered this token.');
      console.log('  Solution: Token will be refreshed next time user opens the app.');
    } else if (err.errorInfo?.code === 'messaging/invalid-registration-token') {
      console.log('\n→ Token format is INVALID.');
    } else if (err.errorInfo?.code === 'messaging/sender-id-mismatch') {
      console.log('\n→ SENDER ID MISMATCH — the google-services.json project does not match the service account!');
      console.log('  Check that both files use the same Firebase project.');
    } else if (err.errorInfo?.code === 'messaging/authentication-error' || err.errorInfo?.httpStatusCode === 401) {
      console.log('\n→ AUTHENTICATION FAILED — service account credentials are invalid or do not have FCM permissions.');
    }
  }
}

sendTest().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
