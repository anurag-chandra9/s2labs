const { PrismaClient } = require('@prisma/client');

// Single shared instance across the app
const prisma = new PrismaClient();

module.exports = prisma;
