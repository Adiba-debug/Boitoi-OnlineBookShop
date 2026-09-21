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

        container.innerHTML = "";

        orders.forEach((order) => {
            const card = document.createElement("div");
            card.id = `hist-card-${order.order_id}`;
            card.className = "bg-white p-5 rounded-lg shadow mb-4 hover:shadow-lg transition";

            const cancellable = order.status === "pending" || order.status === "processing";

            const statusColors = {
                pending:    "bg-yellow-100 text-yellow-800",
                processing: "bg-blue-100 text-blue-700",
                shipped:    "bg-purple-100 text-purple-700",
                delivered:  "bg-green-100 text-green-700",
                cancelled:  "bg-red-100 text-red-600"
            };
            const statusClass = statusColors[order.status] || "bg-gray-200 text-gray-700";

            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <a href="OrderSuccess.html?order_id=${order.order_id}" class="font-bold text-lg hover:text-blue-600">
                        Order #${order.order_id}
                    </a>
                    <span id="hist-status-${order.order_id}"
                        class="text-sm px-3 py-1 rounded-full capitalize font-semibold ${statusClass}">
                        ${order.status}
                    </span>
                </div>

                <div class="text-gray-600 text-sm mt-1">
                    ${new Date(order.order_date).toLocaleDateString()}
                </div>

                <div class="font-bold mt-2">
                    ${order.total_amount} Tk
                </div>

                <div class="mt-3 flex items-center gap-3 flex-wrap">
                    ${order.status === "delivered"
                        ? `<a href="OrderSuccess.html?order_id=${order.order_id}&review=1"
                              class="inline-block bg-yellow-500 text-white text-sm px-4 py-2 rounded hover:bg-yellow-600 transition">
                               ★ Rate &amp; Review Books
                           </a>`
                        : `<a href="OrderSuccess.html?order_id=${order.order_id}"
                              class="text-blue-600 text-sm hover:underline">View Details →</a>`
                    }

                    ${cancellable
                        ? `<button id="hist-cancel-${order.order_id}"
                               class="bg-red-500 text-white text-sm px-4 py-2 rounded hover:bg-red-600 transition font-semibold">
                               Cancel Order
                           </button>`
                        : ""
                    }
                </div>
                <p id="hist-cancel-msg-${order.order_id}" class="text-sm mt-2 hidden"></p>
            `;

            if (cancellable) {
                card.querySelector(`#hist-cancel-${order.order_id}`)
                    .addEventListener("click", () => cancelOrderFromHistory(order.order_id, card));
            }

            container.appendChild(card);
        });

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


// =========================
// Cancel order from order-history page
// =========================

async function cancelOrderFromHistory(orderId, cardEl) {
    const confirmed = confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const btn = cardEl.querySelector(`#hist-cancel-${orderId}`);
    const msgEl = cardEl.querySelector(`#hist-cancel-msg-${orderId}`);

    btn.disabled = true;
    btn.textContent = "Cancelling...";

    try {
        const res = await fetch(
            `http://localhost:5000/api/orders/${orderId}/cancel`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            btn.disabled = false;
            btn.textContent = "Cancel Order";
            msgEl.textContent = data.message || "Cancellation failed.";
            msgEl.className = "text-sm mt-2 text-red-500";
            msgEl.classList.remove("hidden");
            return;
        }

        // Update badge in place
        const badge = cardEl.querySelector(`#hist-status-${orderId}`);
        badge.textContent = "cancelled";
        badge.className = "text-sm px-3 py-1 rounded-full capitalize font-semibold bg-red-100 text-red-600";

        btn.remove();

        msgEl.textContent = "Order cancelled successfully.";
        msgEl.className = "text-sm mt-2 text-green-600";
        msgEl.classList.remove("hidden");

    } catch (err) {
        console.error("Cancel order error:", err);
        btn.disabled = false;
        btn.textContent = "Cancel Order";
        msgEl.textContent = "Something went wrong. Please try again.";
        msgEl.className = "text-sm mt-2 text-red-500";
        msgEl.classList.remove("hidden");
    }
}
