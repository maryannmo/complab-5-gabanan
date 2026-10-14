const express = require("express");
const amqp = require("amqplib");
const crypto = require("crypto");

const app = express();

app.use(express.json());

const PORT = 3000;

const BROKER_URL =
    process.env.BROKER_URL ||
    "amqp://guest:guest@localhost:5672";

const EXCHANGE = "shop.events";

let channel;

async function connectRabbitMQ() {

    while (!channel) {

        try {

            console.log("Connecting to RabbitMQ...");

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

            console.log(
                "Order service connected to RabbitMQ."
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

app.get("/health", (req, res) => {

    res.json({
        service: "order-service",
        status: "running"
    });

});

app.post("/orders", async (req, res) => {

    const {
        customerName,
        product,
        quantity
    } = req.body;

    if (
        !customerName ||
        !product ||
        !quantity
    ) {

        return res.status(400).json({
            error:
                "customerName, product, and quantity are required."
        });

    }

    const order = {

        orderId:
            crypto.randomUUID(),

        customerName,

        product,

        quantity,

        createdAt:
            new Date().toISOString()

    };

    try {

        channel.publish(
            EXCHANGE,
            "order.placed",
            Buffer.from(
                JSON.stringify(order)
            ),
            {
                persistent: true,
                contentType: "application/json"
            }
        );

        console.log(
            "Published order.placed:",
            order
        );

        res.status(201).json(order);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Unable to publish order."
        });

    }

});

app.listen(PORT, () => {

    console.log(
        `Order service running on port ${PORT}`
    );

    connectRabbitMQ();

});