const amqp = require("amqplib");

const BROKER_URL =
    process.env.BROKER_URL ||
    "amqp://guest:guest@localhost:5672";

const EXCHANGE = "shop.events";

const INVENTORY_QUEUE =
    "inventory_order_queue";

let channel;

async function start() {

    while (!channel) {

        try {

            console.log(
                "Inventory service connecting to RabbitMQ..."
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
                INVENTORY_QUEUE,
                {
                    durable: true
                }
            );

            await channel.bindQueue(
                INVENTORY_QUEUE,
                EXCHANGE,
                "order.placed"
            );

            await channel.prefetch(1);

            console.log(
                "Inventory service waiting for orders..."
            );

            channel.consume(
                INVENTORY_QUEUE,
                async message => {

                    if (!message) {
                        return;
                    }

                    try {

                        const order =
                            JSON.parse(
                                message.content.toString()
                            );

                        console.log(
                            "Inventory updated for order:",
                            order.orderId
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