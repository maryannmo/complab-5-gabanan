const amqp = require("amqplib");

const BROKER_URL =
    process.env.BROKER_URL ||
    "amqp://guest:guest@localhost:5672";

const EXCHANGE = "shop.events";

const PAYMENT_QUEUE =
    "notification_payment_queue";

let channel;

async function start() {

    while (!channel) {

        try {

            console.log(
                "Notification service connecting to RabbitMQ..."
            );

            const connection =
                await amqp.connect(BROKER_URL);

            channel =
                await connection.createChannel();

            await channel.assertExchange(
                EXCHANGE,
                "topic",
                {
                    durable: true
                }
            );

            await channel.assertQueue(
                PAYMENT_QUEUE,
                {
                    durable: true
                }
            );

            await channel.bindQueue(
                PAYMENT_QUEUE,
                EXCHANGE,
                "payment.success"
            );

            await channel.prefetch(1);

            console.log(
                "Notification service waiting for payments..."
            );

            channel.consume(
                PAYMENT_QUEUE,
                async message => {

                    if (!message) {
                        return;
                    }

                    try {

                        const payment =
                            JSON.parse(
                                message.content.toString()
                            );

                        console.log(
                            "Notification sent for order:",
                            payment.orderId
                        );

                        await new Promise(
                            resolve =>
                                setTimeout(resolve, 500)
                        );

                        channel.ack(message);

                    } catch (error) {

                        console.error(error);

                        channel.nack(
                            message,
                            false,
                            true
                        );

                    }

                }
            );

        } catch (error) {

            console.log(
                "RabbitMQ not ready. Retrying in 5 seconds..."
            );

            await new Promise(
                resolve => setTimeout(resolve, 5000)
            );

        }

    }

}

start();