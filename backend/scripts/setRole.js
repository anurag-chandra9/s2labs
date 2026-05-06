// Usage: node scripts/setRole.js <clerk_user_id> <role>
// Example: node scripts/setRole.js user_2abc123 trainer
require('dotenv').config();
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const [,, userId, role] = process.argv;

const validRoles = ['student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer'];

if (!userId || !role) {
  console.log('Usage: node scripts/setRole.js <clerk_user_id> <role>');
  console.log('Roles:', validRoles.join(', '));
  process.exit(1);
}

if (!validRoles.includes(role)) {
  console.log('Invalid role. Valid roles:', validRoles.join(', '));
  process.exit(1);
}

clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { role },
})
.then(user => {
  console.log(`✅ Set role="${role}" for user ${user.emailAddresses[0]?.emailAddress}`);
  console.log('Public metadata:', user.publicMetadata);
})
.catch(err => {
  console.error('❌ Failed:', err.message);
});
