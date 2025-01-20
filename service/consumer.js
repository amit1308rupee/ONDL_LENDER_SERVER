const amqp = require('amqplib');
// RabbitMQ connection URL    

const username = 'sunil';
const password = 'W?Xoav}Hg67?PZ#2e';
const host = '18.60.10.92';
const port = 5672;
const encodedUsername = encodeURIComponent(username); // sunil%3Apassword
const encodedPassword = encodeURIComponent(password); // my%40secret
const url = `amqp://${encodedUsername}:${encodedPassword}@${host}:${port}`;

async function consumeMessagesBreLender(exchangeName, routingKey, queueName) {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(exchangeName, "direct");
  const q = await channel.assertQueue(queueName);
  await channel.bindQueue(q.queue, exchangeName, routingKey);

  channel.consume(q.queue, (msg) => {
    const data = JSON.parse(msg.content);
    
    console.log(data);
    channel.ack(msg);
  });
}

module.exports = {consumeMessagesBreLender};