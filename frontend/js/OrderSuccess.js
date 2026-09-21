// =========================
// Status-based message block
// =========================

function getStatusMessage(status) {
    const s = (status || "").toLowerCase();

    const messages = {
        pending: {
            icon: "📦",
            title: "Your order has been placed!",
            body: "Your order is being prepared. We'll update you when it moves to the next stage."
        },
        processing: {
            icon: "📦",
            title: "Your order is being prepared!",
            body: "Your books are being carefully prepared for shipment."
        },
        shipped: {
            icon: "🚚",
            title: "Your order is on its way!",
            body: "Your books have been shipped and are on their way to you. Our delivery agent will contact you before arrival."
        },
        delivered: {
            icon: "✅",
            title: "Your order has been delivered!",
            body: "Your order has been successfully delivered. We hope you enjoy your books!"
        },
        cancelled: {
            icon: "❌",
            title: "Your order has been cancelled.",
            body: "Unfortunately, this order has been cancelled. If you have any questions, please contact support."
        }
    };

    const m = messages[s] || {
        icon: "📋",
        title: `Order status: ${status}`,
        body: "Please check your order history for more details."
    };

    return `
        <div class="bg-white p-8 rounded-lg shadow mb-6 text-center">
            <div class="text-4xl mb-3">${m.icon}</div>
            <h3 class="text-xl font-bold mb-2">${m.title}</h3>
            <p class="text-gray-600">${m.body}</p>
        </div>
    `;
}


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

            <!-- Status Message (dynamic based on order.status) -->
            ${getStatusMessage(order.status)}

            <!-- Continue Shopping -->
            <div class="text-center">
                <a href="index.html" class="inline-block bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700">
                    Continue Shopping
                </a>
            </div>

        `;

        container.innerHTML = html;

        await updateCartCount();

        // If coming from order-history with ?review=1 and order is delivered,
        // show Rate & Review section for each book in the order
        const urlParams2 = new URLSearchParams(window.location.search);
        if (urlParams2.get("review") === "1" && order.status === "delivered") {
            await renderOrderReviewSection(order);
        }

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


// =========================
// Render per-book review widgets for a delivered order
// =========================

async function renderOrderReviewSection(order) {
    const token = localStorage.getItem("token");
    if (!token || !order.items || order.items.length === 0) return;

    const container = document.getElementById("orderContainer");

    const section = document.createElement("div");
    section.className = "bg-white rounded-lg shadow p-8 mt-6";
    section.innerHTML = `
        <h3 class="text-xl font-bold mb-6">Rate &amp; Review Your Books</h3>
        <div id="orderReviewItems"></div>
    `;
    container.appendChild(section);

    const itemsEl = section.querySelector("#orderReviewItems");

    for (const item of order.items) {
        const wrapper = document.createElement("div");
        wrapper.className = "border-b pb-6 mb-6 last:border-0 last:mb-0";

        // Book header
        wrapper.innerHTML = `
            <div class="flex items-center gap-4 mb-3">
                <img src="${item.image_url || 'https://via.placeholder.com/60x80?text=Book'}"
                     class="w-12 h-16 object-contain rounded border bg-gray-50">
                <div>
                    <p class="font-semibold text-gray-800">${escapeHtml(item.title)}</p>
                    <p class="text-gray-500 text-sm">Qty: ${item.quantity}</p>
                </div>
            </div>
            <div id="reviewWidget_${item.book_id}">
                <p class="text-gray-400 text-sm">Checking eligibility...</p>
            </div>
        `;
        itemsEl.appendChild(wrapper);

        // Check eligibility for this book
        try {
            const res = await fetch(
                `http://localhost:5000/api/reviews/eligibility/${item.book_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            const widgetEl = document.getElementById(`reviewWidget_${item.book_id}`);

            if (data.hasReviewed) {
                widgetEl.innerHTML = `
                    <p class="text-green-600 font-semibold text-sm">✓ You have already reviewed this book.</p>
                `;
            } else if (data.eligible) {
                renderInlineReviewForm(widgetEl, item.book_id, token);
            } else {
                widgetEl.innerHTML = `
                    <p class="text-gray-400 text-sm italic">Not eligible to review yet.</p>
                `;
            }
        } catch (e) {
            console.error(e);
        }
    }
}


function renderInlineReviewForm(container, bookId, token) {
    let currentRating = 0;

    container.innerHTML = `
        <div id="starPicker_${bookId}" class="flex gap-1 text-2xl cursor-pointer mb-2">
            ${[1,2,3,4,5].map(i =>
                `<span class="star-pick text-gray-300 hover:text-yellow-400 transition" data-value="${i}">★</span>`
            ).join("")}
        </div>
        <p id="ratingErr_${bookId}" class="text-red-500 text-xs mb-1 hidden">Please select a rating.</p>
        <textarea id="reviewTxt_${bookId}" rows="3" maxlength="2000"
            placeholder="Write your review..."
            class="w-full border rounded p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-2"></textarea>
        <p id="commentErr_${bookId}" class="text-red-500 text-xs mb-1 hidden">Please write a review.</p>
        <button id="submitBtn_${bookId}"
            class="bg-blue-600 text-white text-sm px-5 py-2 rounded hover:bg-blue-700 transition font-semibold">
            Submit Review
        </button>
        <p id="submitMsg_${bookId}" class="mt-2 text-sm hidden"></p>
    `;

    const stars = container.querySelectorAll(".star-pick");
    stars.forEach(star => {
        star.addEventListener("mouseenter", () => {
            const v = Number(star.dataset.value);
            stars.forEach(s => {
                s.classList.toggle("text-yellow-400", Number(s.dataset.value) <= v);
                s.classList.toggle("text-gray-300", Number(s.dataset.value) > v);
            });
        });
        star.addEventListener("mouseleave", () => {
            stars.forEach(s => {
                s.classList.toggle("text-yellow-400", Number(s.dataset.value) <= currentRating);
                s.classList.toggle("text-gray-300", Number(s.dataset.value) > currentRating);
            });
        });
        star.addEventListener("click", () => {
            currentRating = Number(star.dataset.value);
            document.getElementById(`ratingErr_${bookId}`).classList.add("hidden");
        });
    });

    document.getElementById(`submitBtn_${bookId}`).addEventListener("click", async () => {
        const comment = document.getElementById(`reviewTxt_${bookId}`).value.trim();
        let valid = true;

        if (!currentRating) {
            document.getElementById(`ratingErr_${bookId}`).classList.remove("hidden");
            valid = false;
        }
        if (!comment) {
            document.getElementById(`commentErr_${bookId}`).classList.remove("hidden");
            valid = false;
        }
        if (!valid) return;

        const btn = document.getElementById(`submitBtn_${bookId}`);
        btn.disabled = true;
        btn.textContent = "Submitting...";

        try {
            const res = await fetch("http://localhost:5000/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ book_id: bookId, rating: currentRating, review_comment: comment })
            });
            const data = await res.json();

            const msgEl = document.getElementById(`submitMsg_${bookId}`);
            if (res.ok) {
                container.innerHTML = `<p class="text-green-600 font-semibold text-sm">✓ Review submitted successfully!</p>`;
            } else {
                btn.disabled = false;
                btn.textContent = "Submit Review";
                msgEl.textContent = data.message || "Submission failed.";
                msgEl.className = "mt-2 text-sm text-red-500";
                msgEl.classList.remove("hidden");
            }
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.textContent = "Submit Review";
        }
    });
}
