const amqp = require("amqplib");

const BROKER_URL =
    process.env.BROKER_URL ||
    "amqp://guest:guest@localhost:5672";

const EXCHANGE = "shop.events";

const ORDER_QUEUE = "payment_order_queue";

let channel;

async function start() {

    while (!channel) {

        try {

            console.log(
                "Payment service connecting to RabbitMQ..."
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
                ORDER_QUEUE,
                {
                    durable: true
                }
            );

            await channel.bindQueue(
                ORDER_QUEUE,
                EXCHANGE,
                "order.placed"
            );

            await channel.prefetch(1);

            console.log(
                "Payment service waiting for orders..."
            );

            channel.consume(
                ORDER_QUEUE,
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
                            "Payment processing order:",
                            order.orderId
                        );

                        await new Promise(
                            resolve =>
                                setTimeout(resolve, 1000)
                        );

                        const payment = {

                            orderId:
                                order.orderId,

                            customerName:
                                order.customerName,

                            amount:
                                order.quantity,

                            status:
                                "SUCCESS",

                            processedAt:
                                new Date().toISOString()

                        };

                        channel.publish(
                            EXCHANGE,
                            "payment.success",
                            Buffer.from(
                                JSON.stringify(payment)
                            ),
                            {
                                persistent: true,
                                contentType:
                                    "application/json"
                            }
                        );

                        console.log(
                            "Published payment.success:",
                            payment.orderId
                        );

                        channel.ack(message);

                    } catch (error) {

                        console.error(
                            "Payment processing error:",
                            error
                        );

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