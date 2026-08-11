async function loadOrder() {

    const container = document.getElementById("orderContainer");

    container.innerHTML = "";


    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("order_id");

    if (!orderId) {

        container.innerHTML = `
            <div class="text-center bg-white p-10 rounded-lg shadow">

                <h3 class="text-2xl font-bold mb-4">
                    Order not found ❌
                </h3>

                <a
                    href="index.html"
                    class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">

                    Go to Home

                </a>

            </div>
        `;

        return;

    }


    try {

        const response = await fetch(
            `http://localhost:5000/api/orders/${orderId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load order");
        }

        const order = await response.json();


        // Success header + order info
        let html = `

            <div class="text-center bg-white p-8 rounded-lg shadow mb-6">

                <h2 class="text-3xl font-bold text-green-600 mb-2">
                    Order Placed Successfully ✅
                </h2>

                <p class="text-gray-600">
                    Order ID: #${order.order_id}
                </p>

                <p class="text-gray-600">
                    Status: ${order.status}
                </p>

            </div>

        `;


        // Item list
        html += `<div class="bg-white p-6 rounded-lg shadow mb-6">`;

        order.items.forEach((item) => {

            const subtotal =
                Number(item.unit_price) * Number(item.quantity);

            html += `

                <div class="flex items-center gap-5 border-b py-4 last:border-b-0">

                    <img
                        src="${item.image_url}"
                        alt="${item.title}"
                        class="w-16 h-20 object-cover rounded"
                    >

                    <div class="flex-1">

                        <h3 class="font-bold">
                            ${item.title}
                        </h3>

                        <p class="text-gray-600 text-sm">
                            ${item.quantity} × ${item.unit_price} Tk
                        </p>

                    </div>

                    <p class="font-bold">
                        ${subtotal} Tk
                    </p>

                </div>

            `;

        });

        html += `</div>`;


        // Total + continue shopping
        html += `

            <div class="bg-white p-6 rounded-lg shadow text-right">

                <h3 class="text-2xl font-bold mb-4">
                    Total: ${order.total_amount} Tk
                </h3>

                <a
                    href="index.html"
                    class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">

                    Continue Shopping

                </a>

            </div>

        `;

        container.innerHTML = html;

        await updateCartCount();

    } catch (error) {

        console.error("Order loading error:", error);

        container.innerHTML = `
            <p class="text-center text-red-500">
                Failed to load order details.
            </p>
        `;

    }

}


// Page load
document.addEventListener("DOMContentLoaded", function () {
    loadOrder();
});