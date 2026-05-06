const prisma = require('../lib/prisma');

const handleWebhook = async (req, res) => {
  // express.raw() gives us a Buffer — parse it
  let event;
  try {
    const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    event = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  try {
    if (event.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, public_metadata } = event.data;
      const email = email_addresses?.[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown';
      const role = public_metadata?.role || 'student';

      if (!email) return res.status(400).json({ message: 'Email missing from webhook payload' });

      await prisma.user.upsert({
        where: { id },
        update: { name, email, role },
        create: { id, email, name, role },
      });
      console.log(`[webhook] user.created: ${id} role=${role}`);
    }

    if (event.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, public_metadata } = event.data;
      const email = email_addresses?.[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim();
      const role = public_metadata?.role;

      // Only update fields that are present
      const data = {};
      if (email) data.email = email;
      if (name) data.name = name;
      if (role) data.role = role;

      // Use upsert in case user.created webhook was missed
      await prisma.user.upsert({
        where: { id },
        update: data,
        create: { id, email: email || '', name: name || 'Unknown', role: role || 'student' },
      });
      console.log(`[webhook] user.updated: ${id}`);
    }

    if (event.type === 'user.deleted') {
      await prisma.user.delete({ where: { id: event.data.id } }).catch(() => {
        // Ignore if user doesn't exist in our DB
      });
      console.log(`[webhook] user.deleted: ${event.data.id}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { handleWebhook };
