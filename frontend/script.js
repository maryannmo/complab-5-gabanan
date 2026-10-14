const API_URL = "http://localhost:8080";

const orderForm = document.getElementById("orderForm");
const result = document.getElementById("result");

orderForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const customerName =
        document.getElementById("customerName").value;

    const product =
        document.getElementById("product").value;

    const quantity =
        Number(document.getElementById("quantity").value);

    result.textContent = "Submitting order...";

    try {

        const response = await fetch(
            `${API_URL}/orders`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    customerName,
                    product,
                    quantity
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to submit order."
            );
        }

        result.textContent =
            `Order submitted successfully! Order ID: ${data.orderId}`;

        orderForm.reset();

    } catch (error) {

        result.textContent =
            `Error: ${error.message}`;

    }

});