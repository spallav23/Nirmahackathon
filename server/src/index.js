const app = require('./app');
const { connectDb } = require('./config/db');
const { port } = require('./config/env');
const { runConsumer, stopConsumer } = require('./services/kafkaConsumer');

async function start() {
  await connectDb();

  try {
    await runConsumer();
  } catch (err) {
    console.warn('Kafka consumer not started:', err.message);
  }

  const server = app.listen(port, () => {
    console.log(`Main server listening on port ${port}`);
  });

  process.on('SIGTERM', async () => {
    await stopConsumer();
    server.close();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
