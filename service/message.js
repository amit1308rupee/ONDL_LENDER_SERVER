const amqp = require('amqplib');
// RabbitMQ connection URL    

const username = 'sunil';
const password = 'W?Xoav}Hg67?PZ#2e';
const host = '18.60.10.92';
const port = 5672;

const encodedUsername = encodeURIComponent(username); // sunil%3Apassword
const encodedPassword = encodeURIComponent(password); // my%40secret

const url = `amqp://${encodedUsername}:${encodedPassword}@${host}:${port}`;

async function setupChannel() {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  return channel;
}

async function publishMessage(exchangeName, routingKey, leadData) {

  try {

    setupChannel().then(channel => {
      channel.assertExchange(exchangeName, "direct");
      channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(leadData))
      );
      console.log("data send", exchangeName, "Datas", leadData);

      console.log(
        `The new ${routingKey} log is sent to exchange ${exchangeName}`
      );
      // Close the connection
      setTimeout(() => {
        //channel.close();
        // connection.close();
      }, 50000);
    }).catch(err => {
      console.error('Error:', err);
    });

  } catch (err) {
    console.error('Error in publish message', err);

  }
}

module.exports = { publishMessage };