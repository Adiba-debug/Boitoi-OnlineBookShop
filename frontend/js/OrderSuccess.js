async function loadOrder() {

    const container = document.getElementById("orderContainer");
    container.innerHTML = "";

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("order_id");

    if (!orderId) {
        container.innerHTML = `
            <div class="text-center bg-white p-10 rounded-lg shadow">
                <h3 class="text-2xl font-bold mb-4">Order not found ❌</h3>
                <a href="index.html" class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
                    Go to Home
                </a>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`);
        if (!response.ok) throw new Error("Failed to load order");

        const order = await response.json();

        const subtotal =
            Number(order.total_amount) - Number(order.delivery_charge) + Number(order.discount_amount);

        const totalItemsCount = order.items.reduce(
            (sum, item) => sum + Number(item.quantity), 0
        );

        let html = `

            <!-- Success Header -->
            <div class="text-center bg-white p-10 rounded-lg shadow mb-6">
                <div class="text-6xl mb-4">✅</div>
                <h2 class="text-3xl font-bold text-green-600 mb-2">
                    Order Placed Successfully!
                </h2>
                <p class="text-gray-600 mb-1">
                    Thank you for shopping with us.
                </p>
                <p class="text-gray-500 text-sm">
                    Order ID: #${order.order_id} &nbsp;|&nbsp; Status: <span class="font-semibold capitalize">${order.status}</span>
                </p>
            </div>

            <!-- Customer Info -->
            <div class="bg-white p-8 rounded-lg shadow mb-6">
                <h3 class="text-xl font-bold mb-4">Customer Information</h3>

                <ul class="space-y-3 text-gray-700">
                    <li class="flex justify-between border-b pb-2">
                        <span>🙍 Name</span>
                        <span class="font-semibold">${order.customer_name}</span>
                    </li>
                    <li class="flex justify-between border-b pb-2">
                        <span>✉️ Email</span>
                        <span class="font-semibold">${order.customer_email}</span>
                    </li>
                    <li class="flex justify-between pb-2">
                        <span>📞 Phone</span>
                        <span class="font-semibold">${order.customer_phone || "N/A"}</span>
                    </li>
                </ul>
            </div>

            <!-- Order Details (points) -->
            <div class="bg-white p-8 rounded-lg shadow mb-6">
                <h3 class="text-xl font-bold mb-4">Order Details</h3>

                <ul class="space-y-3 text-gray-700">
                    <li class="flex justify-between border-b pb-2">
                        <span>📦 Total Items</span>
                        <span class="font-semibold">${totalItemsCount}</span>
                    </li>
                    <li class="flex justify-between border-b pb-2">
                        <span>💳 Payment Method</span>
                        <span class="font-semibold">${order.payment_method || "COD"} (Cash on Delivery)</span>
                    </li>
                    <li class="flex justify-between border-b pb-2">
                        <span>📍 Delivery Address</span>
                        <span class="font-semibold text-right max-w-[60%]">${order.shipping_address || "N/A"}</span>
                    </li>
                    <li class="flex justify-between border-b pb-2">
                        <span>🚚 Estimated Delivery</span>
                        <span class="font-semibold">2 - 4 business days</span>
                    </li>
                    <li class="flex justify-between border-b pb-2">
                        <span>Subtotal</span>
                        <span>${subtotal} Tk</span>
                    </li>
                    ${
                        Number(order.discount_amount) > 0
                            ? `<li class="flex justify-between border-b pb-2 text-green-600">
                                <span>Coupon Discount</span>
                                <span>- ${order.discount_amount} Tk</span>
                               </li>`
                            : ""
                    }
                    <li class="flex justify-between border-b pb-2">
                        <span>Delivery Charge</span>
                        <span>${order.delivery_charge} Tk</span>
                    </li>
                    <li class="flex justify-between pt-2">
                        <span class="text-xl font-bold">Grand Total</span>
                        <span class="text-xl font-bold text-blue-600">${order.total_amount} Tk</span>
                    </li>
                </ul>
            </div>

            <!-- Delivery Info Message -->
            <div class="bg-white p-8 rounded-lg shadow mb-6 text-center">
                <div class="text-4xl mb-3">🚚</div>
                <h3 class="text-xl font-bold mb-2">Your order is on its way!</h3>
                <p class="text-gray-600">
                    We're preparing your books with care. You'll receive your order
                    within <span class="font-semibold">2 - 4 business days</span>.
                    Our delivery agent will contact you before arrival.
                </p>
            </div>

            <!-- Continue Shopping -->
            <div class="text-center">
                <a href="index.html" class="inline-block bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700">
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

document.addEventListener("DOMContentLoaded", function () {
    loadOrder();
});