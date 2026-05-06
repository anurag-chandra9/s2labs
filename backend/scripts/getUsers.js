require('dotenv').config();
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

clerk.users.getUserList({ limit: 20 })
  .then(r => {
    const users = r.data || r;
    users.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.emailAddresses[0]?.emailAddress}`);
      console.log(`Metadata: ${JSON.stringify(u.publicMetadata)}`);
      console.log('---');
    });
  })
  .catch(e => console.error('Error:', e.message));
