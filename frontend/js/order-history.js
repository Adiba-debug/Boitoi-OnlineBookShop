async function loadOrderHistory() {

    const container = document.getElementById("orderHistoryContainer");
    const user = getLoggedInUser();

    if (!user) {

        container.innerHTML = `
            <div class="text-center bg-white p-10 rounded-lg shadow">

                <h3 class="text-2xl font-bold mb-4">
                    Please login first 🔐
                </h3>

                <a
                    href="login.html"
                    class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">

                    Login

                </a>

            </div>
        `;

        return;

    }

    try {

        const response = await fetch(
            `http://localhost:5000/api/orders/user/${user.user_id}`
        );

        if (!response.ok) {
            throw new Error("Failed to load order history");
        }

        const orders = await response.json();

        if (orders.length === 0) {

            container.innerHTML = `
                <div class="text-center bg-white p-10 rounded-lg shadow">

                    <h3 class="text-2xl font-bold mb-4">
                        No orders yet 📦
                    </h3>

                    <a
                        href="index.html"
                        class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">

                        Start Shopping

                    </a>

                </div>
            `;

            return;

        }

        container.innerHTML = orders.map((order) => `

            <a
                href="OrderSuccess.html?order_id=${order.order_id}"
                class="block bg-white p-5 rounded-lg shadow mb-4 hover:shadow-lg transition">

                <div class="flex justify-between items-center">

                    <span class="font-bold text-lg">
                        Order #${order.order_id}
                    </span>

                    <span class="text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 capitalize">
                        ${order.status}
                    </span>

                </div>

                <div class="text-gray-600 text-sm mt-1">
                    ${new Date(order.order_date).toLocaleDateString()}
                </div>

                <div class="font-bold mt-2">
                    ${order.total_amount} Tk
                </div>

            </a>

        `).join("");

    } catch (error) {

        console.error("Order history error:", error);

        container.innerHTML = `
            <p class="text-center text-red-500">
                Failed to load order history.
            </p>
        `;

    }

}


// Page load
document.addEventListener("DOMContentLoaded", function () {
    loadOrderHistory();
});