const express = require("express");

const app = express();

const PORT = 8080;

const ORDER_SERVICE_URL =
    process.env.ORDER_SERVICE_URL ||
    "http://localhost:3000";

const CORS_ORIGIN =
    process.env.CORS_ORIGIN ||
    "http://localhost:3000";

app.use(express.json());

app.use((req, res, next) => {

    res.header(
        "Access-Control-Allow-Origin",
        CORS_ORIGIN
    );

    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.get("/health", (req, res) => {

    res.json({
        service: "api-gateway",
        status: "running"
    });

});

app.post("/orders", async (req, res) => {

    try {

        const response = await fetch(
            `${ORDER_SERVICE_URL}/orders`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(req.body)
            }
        );

        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Order service is unavailable."
        });

    }

});

app.listen(PORT, () => {

    console.log(
        `API Gateway running on port ${PORT}`
    );

});