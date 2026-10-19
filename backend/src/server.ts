import { app } from './app';
import { env } from './config/env';
import { testDbConnection } from './config/db';

async function startServer() {
  const server = app.listen(env.PORT, async () => {
    console.log(`🚀 LostLink Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`🔗 Allowed Frontend URL: ${env.FRONTEND_URL}`);

    const isConnected = await testDbConnection();
    if (isConnected) {
      console.log('✅ PostgreSQL database connected successfully.');
    } else {
      console.warn('⚠️ PostgreSQL database connection pending or unreachable (Check DATABASE_URL).');
    }
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n🛑 Gracefully shutting down LostLink server...');
    server.close(() => {
      console.log('Server terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
