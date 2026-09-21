const user = JSON.parse(localStorage.getItem("user"));


// User login না থাকলে login page-এ পাঠাবে
if (!user) {

    window.location.href = "login.html";

}


// =========================
// Show User Information
// =========================

document.getElementById("userName").textContent = user.name || "N/A";

document.getElementById("userEmail").textContent = user.email || "N/A";

document.getElementById("userPhone").textContent =
    user.phone_number || "Not provided";

document.getElementById("userAddress").textContent =
    user.address || "Not provided";

document.getElementById("userRole").textContent =
    user.role || "customer";

// =========================
// Admin Inventory Button
// =========================

const adminInventoryButton =
    document.getElementById("adminInventoryButton");

if (user.role === "admin" && adminInventoryButton) {

    adminInventoryButton.innerHTML = `
        <button
            id="openAdminInventory"
            class="bg-blue-600 text-white px-6 py-3 rounded-lg
                   hover:bg-blue-700 transition font-semibold">
            Open Admin Inventory
        </button>
    `;

    document
        .getElementById("openAdminInventory")
        .addEventListener("click", function () {
            window.location.href = "admin-inventory.html";
        });
}

// =========================
// Load User Orders
// =========================

async function loadOrders() {

    const ordersContainer = document.getElementById("ordersContainer");

    try {

        const response = await fetch(
            `http://localhost:5000/api/orders/user/${user.user_id}`
        );


        const orders = await response.json();


        if (!response.ok) {

            throw new Error(orders.message || "Failed to load orders");

        }


        // No orders

        if (orders.length === 0) {

            ordersContainer.innerHTML = `
                <div class="bg-white p-8 rounded-lg shadow text-center">

                    <p class="text-xl text-gray-500">
                        You haven't placed any orders yet.
                    </p>

                </div>
            `;

            return;

        }

        // Display orders — each order now includes its items
        ordersContainer.innerHTML = "";

        orders.forEach(order => {
            ordersContainer.appendChild(buildOrderCard(order));
        });


    } catch (error) {

        console.log(error);

        ordersContainer.innerHTML = `

            <div class="bg-white p-8 rounded-lg shadow text-center">

                <p class="text-red-500 text-lg">
                    Failed to load orders.
                </p>

            </div>

        `;

    }

}


// Load orders
loadOrders();


// =========================
// Build a single order card element
// =========================

function buildOrderCard(order) {
    const orderCard = document.createElement("div");
    orderCard.id = `order-card-${order.order_id}`;
    orderCard.className = "bg-white rounded-lg shadow p-6 mb-4";

    // Items HTML
    let itemsHTML = "";
    if (order.items && order.items.length > 0) {
        itemsHTML = `
            <div class="mt-4 mb-4">
                <p class="font-semibold text-gray-700 mb-2">Items (${order.items.length}):</p>
                <div class="space-y-3">
                    ${order.items.map(item => {
                        const subtotal = Number(item.unit_price) * Number(item.quantity);
                        return `
                        <div class="flex items-center gap-4 border-b pb-3 last:border-0">
                            <img
                                src="${item.image_url || 'https://via.placeholder.com/60x80?text=Book'}"
                                alt="${item.title}"
                                class="w-12 h-16 object-contain rounded border bg-gray-50 flex-shrink-0"
                            >
                            <div class="flex-1">
                                <p class="font-semibold text-gray-800 leading-tight">${item.title}</p>
                                <p class="text-sm text-gray-500">
                                    Qty: ${item.quantity} &nbsp;×&nbsp; ${item.unit_price} Tk
                                    &nbsp;=&nbsp;
                                    <span class="font-semibold text-gray-700">${subtotal} Tk</span>
                                </p>
                            </div>
                        </div>`;
                    }).join("")}
                </div>
            </div>
        `;
    }

    const deliveryCharge = Number(order.delivery_charge) || 150;
    const discount = Number(order.discount_amount) || 0;
    const cancellable = order.status === "pending" || order.status === "processing";

    const statusColors = {
        pending:    "bg-yellow-100 text-yellow-800",
        processing: "bg-blue-100 text-blue-700",
        shipped:    "bg-purple-100 text-purple-700",
        delivered:  "bg-green-100 text-green-700",
        cancelled:  "bg-red-100 text-red-600"
    };
    const statusClass = statusColors[order.status] || "bg-gray-100 text-gray-700";

    orderCard.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <h3 class="text-xl font-bold">Order #${order.order_id}</h3>
            <span id="status-badge-${order.order_id}"
                class="px-3 py-1 rounded-full font-bold capitalize text-sm ${statusClass}">
                ${order.status}
            </span>
        </div>
        <p class="text-gray-500 text-sm mb-3">
            ${new Date(order.order_date).toLocaleString()}
        </p>

        ${itemsHTML}

        <div class="border-t pt-3 text-sm text-gray-600 space-y-1">
            ${discount > 0 ? `<p>Discount: <span class="text-green-600 font-semibold">-${discount} Tk</span></p>` : ""}
            <p>Delivery Charge: <span class="font-semibold">${deliveryCharge} Tk</span></p>
            <p>Payment: <span class="font-semibold">${order.payment_method || "COD"}</span></p>
            <p class="text-base font-bold text-gray-800 pt-1">
                Grand Total: ${order.total_amount} Tk
            </p>
        </div>

        <div class="mt-4 flex items-center gap-3 flex-wrap">
            <a href="OrderSuccess.html?order_id=${order.order_id}"
                class="text-blue-600 hover:underline text-sm">View Full Details →</a>

            ${cancellable
                ? `<button
                       id="cancel-btn-${order.order_id}"
                       class="bg-red-500 text-white text-sm px-4 py-2 rounded hover:bg-red-600 transition font-semibold">
                       Cancel Order
                   </button>`
                : ""
            }
        </div>
        <p id="cancel-msg-${order.order_id}" class="text-sm mt-2 hidden"></p>
    `;

    // Wire up cancel button if present
    if (cancellable) {
        orderCard
            .querySelector(`#cancel-btn-${order.order_id}`)
            .addEventListener("click", () => cancelOrder(order.order_id, orderCard));
    }

    return orderCard;
}


// =========================
// Cancel an order
// =========================

async function cancelOrder(orderId, cardEl) {
    const confirmed = confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const btn = cardEl.querySelector(`#cancel-btn-${orderId}`);
    const msgEl = cardEl.querySelector(`#cancel-msg-${orderId}`);

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

        // Update status badge in place — no full reload needed
        const badge = cardEl.querySelector(`#status-badge-${orderId}`);
        badge.textContent = "cancelled";
        badge.className = "px-3 py-1 rounded-full font-bold capitalize text-sm bg-red-100 text-red-600";

        // Remove the cancel button
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
