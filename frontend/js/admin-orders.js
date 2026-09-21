const API_BASE = "http://localhost:5000/api";
const user = JSON.parse(localStorage.getItem("user"));
const isSuperAdmin = user?.role === "superadmin";

// ===============================
// GET ADMIN TOKEN
// ===============================

function getToken() {
    return localStorage.getItem("token");
}

// ===============================
// AUTH HEADER
// ===============================

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
    };
}

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS = {
    pending: "bg-yellow-200 text-yellow-800",
    processing: "bg-blue-200 text-blue-800",
    shipped: "bg-purple-200 text-purple-800",
    delivered: "bg-green-200 text-green-800",
    cancelled: "bg-red-200 text-red-800",
};

// ===============================
// LOAD ALL ORDERS
// ===============================

async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to load orders");
        }

        const orders = await response.json();

        const tableBody = document.getElementById("ordersTableBody");
        tableBody.innerHTML = "";

        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-6 text-center text-gray-500">
                        No orders yet
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach((order) => {
            const row = document.createElement("tr");
            row.className = "border-b";

            const statusClass = STATUS_COLORS[order.status] || "bg-gray-200 text-gray-800";
            const isLocked = order.status === "delivered" || order.status === "cancelled";

            row.innerHTML = `
                <td class="p-3 font-semibold">#${order.order_id}</td>

                <td class="p-3">${order.customer_name || "N/A"}</td>

                <td class="p-3">
                    ${new Date(order.order_date).toLocaleDateString()}
                </td>

                <td class="p-3">৳${order.total_amount}</td>

                <td class="p-3 capitalize">${order.payment_method || "COD"}</td>

                <td class="p-3">
                    <span class="px-3 py-1 rounded-full text-sm capitalize ${statusClass}">
                        ${order.status}
                    </span>
                </td>

                <td class="p-3 flex gap-2 items-center">
                    <button
                        class="viewOrderBtn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        data-id="${order.order_id}"
                    >
                        View
                    </button>

                    <select
    class="statusSelect border rounded p-1 text-sm"
    data-id="${order.order_id}"
    ${(isLocked || isSuperAdmin) ? "disabled" : ""}
>
                        ${VALID_STATUSES.map(
                (s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`
            ).join("")}
                    </select>
                </td>
            `;

            tableBody.appendChild(row);
        });

        attachRowEvents();

    } catch (error) {
        console.error("Load orders error:", error);
        document.getElementById("ordersTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="p-6 text-center text-red-500">
                    Failed to load orders
                </td>
            </tr>
        `;
    }
}

// ===============================
// ATTACH ROW EVENTS
// ===============================

function attachRowEvents() {

    document.querySelectorAll(".viewOrderBtn").forEach((btn) => {
        btn.addEventListener("click", () => {
            viewOrder(btn.dataset.id);
        });
    });

    document.querySelectorAll(".statusSelect").forEach((select) => {
        const originalValue = select.value;

        select.addEventListener("change", async () => {
            const orderId = select.dataset.id;
            const newStatus = select.value;

            const confirmChange = confirm(
                `Change order #${orderId} status to "${newStatus}"?`
            );

            if (!confirmChange) {
                select.value = originalValue;
                return;
            }

            await updateOrderStatus(orderId, newStatus);
        });
    });
}

// ===============================
// UPDATE ORDER STATUS
// ===============================

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to update status");
            loadOrders();
            return;
        }

        loadOrders();

    } catch (error) {
        console.error("Update status error:", error);
        alert("Something went wrong while updating status");
        loadOrders();
    }
}

// ===============================
// VIEW SINGLE ORDER
// ===============================

async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to load order details");
        }

        const order = await response.json();

        const itemsHtml = order.items
            .map(
                (item) => `
                <div class="flex justify-between border-b py-2">
                    <span>${item.title} × ${item.quantity}</span>
                    <span>৳${item.unit_price}</span>
                </div>
            `
            )
            .join("");

        document.getElementById("orderDetailContent").innerHTML = `
            <div class="space-y-2 mb-4">
                <p><span class="font-semibold">Customer:</span> ${order.customer_name}</p>
                <p><span class="font-semibold">Email:</span> ${order.customer_email}</p>
                <p><span class="font-semibold">Phone:</span> ${order.customer_phone || "N/A"}</p>
                <p><span class="font-semibold">Delivery Address:</span> ${order.shipping_address || "N/A"}</p>
                <p><span class="font-semibold">Status:</span> <span class="capitalize">${order.status}</span></p>
            </div>

            <h4 class="font-bold mb-2">Items</h4>
            <div class="mb-4">${itemsHtml}</div>

            <div class="border-t pt-3 space-y-1">
                <p>Delivery Charge: ৳${order.delivery_charge}</p>
                <p>Discount: ৳${order.discount_amount}</p>
                <p class="text-xl font-bold">Total: ৳${order.total_amount}</p>
            </div>
        `;

        document.getElementById("orderDetailModal").classList.remove("hidden");

    } catch (error) {
        console.error("View order error:", error);
        alert("Failed to load order details");
    }
}

document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("orderDetailModal").classList.add("hidden");
});

// ===============================
// LOGOUT
// ===============================

document.getElementById("logoutBtn").addEventListener("click", async () => {
    const token = getToken();

    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        console.error(error);
    }

    localStorage.removeItem("token");
    window.location.href = "login.html";
});

// ===============================
// INITIAL LOAD
// ===============================

loadOrders();