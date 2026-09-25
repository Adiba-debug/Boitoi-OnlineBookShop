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
                        const reviewBtnId = `review-btn-${order.order_id}-${item.book_id}`;
                        const reviewBtn = order.status === "delivered"
                            ? `<button
                                   id="${reviewBtnId}"
                                   data-book-id="${item.book_id}"
                                   data-book-title="${item.title.replace(/"/g, '&quot;')}"
                                   class="review-btn mt-1 text-xs px-3 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 transition">
                                   Loading...
                               </button>`
                            : "";
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
                                ${reviewBtn}
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

    // Wire up review buttons for delivered orders
    if (order.status === "delivered") {
        orderCard.querySelectorAll(".review-btn").forEach(btn => {
            const bookId  = Number(btn.dataset.bookId);
            const bookTitle = btn.dataset.bookTitle;

            // Check eligibility and set button label
            checkReviewEligibility(bookId).then(({ hasReviewed, reviewId }) => {
                btn.textContent = hasReviewed ? "Edit Review" : "Add Review";
                btn.dataset.hasReviewed = hasReviewed ? "1" : "0";
                btn.dataset.reviewId = reviewId || "";
            });

            btn.addEventListener("click", () => {
                openReviewModal(bookId, bookTitle, btn);
            });
        });
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


// =========================
// Review eligibility check
// =========================

async function checkReviewEligibility(bookId) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(
            `http://localhost:5000/api/reviews/eligibility/${bookId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return { hasReviewed: false, reviewId: null };
        const data = await res.json();
        return { hasReviewed: data.hasReviewed || false, reviewId: data.review_id || null };
    } catch {
        return { hasReviewed: false, reviewId: null };
    }
}


// =========================
// Review modal state
// =========================

let _reviewModal = {
    bookId:    null,
    reviewId:  null,
    rating:    0,
    sourcBtn:  null
};

function _setModalStars(rating) {
    _reviewModal.rating = rating;
    document.querySelectorAll("#reviewModalStars .modal-star").forEach(s => {
        const v = Number(s.dataset.value);
        s.classList.toggle("text-yellow-400", v <= rating);
        s.classList.toggle("text-gray-300",   v >  rating);
    });
}

// Wire modal close / cancel once
document.addEventListener("DOMContentLoaded", function () {
    const modal     = document.getElementById("reviewModal");
    const closeBtn  = document.getElementById("reviewModalClose");
    const cancelBtn = document.getElementById("reviewModalCancel");
    const submitBtn = document.getElementById("reviewModalSubmit");
    const stars     = document.querySelectorAll("#reviewModalStars .modal-star");

    function closeModal() {
        modal.classList.add("hidden");
        _reviewModal = { bookId: null, reviewId: null, rating: 0, sourcBtn: null };
        _setModalStars(0);
        document.getElementById("reviewModalComment").value = "";
        document.getElementById("reviewModalRatingError").classList.add("hidden");
        document.getElementById("reviewModalCommentError").classList.add("hidden");
        document.getElementById("reviewModalMsg").classList.add("hidden");
    }

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

    // Star hover + click
    stars.forEach(star => {
        star.addEventListener("mouseenter", () => {
            const v = Number(star.dataset.value);
            stars.forEach(s => {
                s.classList.toggle("text-yellow-400", Number(s.dataset.value) <= v);
                s.classList.toggle("text-gray-300",   Number(s.dataset.value) >  v);
            });
        });
        star.addEventListener("mouseleave", () => _setModalStars(_reviewModal.rating));
        star.addEventListener("click", () => {
            _setModalStars(Number(star.dataset.value));
            document.getElementById("reviewModalRatingError").classList.add("hidden");
        });
    });

    // Submit
    submitBtn.addEventListener("click", async () => {
        const comment = document.getElementById("reviewModalComment").value.trim();
        let valid = true;

        if (!_reviewModal.rating) {
            document.getElementById("reviewModalRatingError").classList.remove("hidden");
            valid = false;
        }
        if (!comment) {
            document.getElementById("reviewModalCommentError").classList.remove("hidden");
            valid = false;
        }
        if (!valid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        const token = localStorage.getItem("token");
        const isEdit = !!_reviewModal.reviewId;

        try {
            const url    = isEdit
                ? `http://localhost:5000/api/reviews/${_reviewModal.reviewId}`
                : `http://localhost:5000/api/reviews`;
            const method = isEdit ? "PUT" : "POST";
            const body   = isEdit
                ? { rating: _reviewModal.rating, review_comment: comment }
                : { book_id: _reviewModal.bookId, rating: _reviewModal.rating, review_comment: comment };

            const res  = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            const msgEl = document.getElementById("reviewModalMsg");

            if (!res.ok) {
                msgEl.textContent = data.message || "Submission failed.";
                msgEl.className = "text-sm mt-3 text-red-500";
                msgEl.classList.remove("hidden");
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Review";
                return;
            }

            // Update the source button label
            if (_reviewModal.sourcBtn) {
                _reviewModal.sourcBtn.textContent = "Edit Review";
                _reviewModal.sourcBtn.dataset.hasReviewed = "1";
                if (data.review?.review_id) {
                    _reviewModal.sourcBtn.dataset.reviewId = data.review.review_id;
                }
            }

            msgEl.textContent = isEdit ? "Review updated!" : "Review submitted!";
            msgEl.className = "text-sm mt-3 text-green-600";
            msgEl.classList.remove("hidden");

            submitBtn.textContent = "Submit Review";
            submitBtn.disabled = false;

            // Close after a brief moment
            setTimeout(closeModal, 1200);

        } catch (err) {
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Review";
        }
    });
});


// =========================
// Open review modal for a book
// =========================

async function openReviewModal(bookId, bookTitle, sourceBtn) {
    _reviewModal.bookId   = bookId;
    _reviewModal.sourcBtn = sourceBtn;
    _reviewModal.rating   = 0;

    document.getElementById("reviewModalTitle").textContent =
        sourceBtn.dataset.hasReviewed === "1" ? "Edit Your Review" : "Add a Review";
    document.getElementById("reviewModalBookName").textContent = bookTitle;
    document.getElementById("reviewModalComment").value = "";
    document.getElementById("reviewModalMsg").classList.add("hidden");
    document.getElementById("reviewModalRatingError").classList.add("hidden");
    document.getElementById("reviewModalCommentError").classList.add("hidden");
    _setModalStars(0);

    // If editing, pre-load existing review
    const reviewId = sourceBtn.dataset.reviewId;
    if (sourceBtn.dataset.hasReviewed === "1" && reviewId) {
        _reviewModal.reviewId = Number(reviewId);
        try {
            const res = await fetch(`http://localhost:5000/api/reviews/book/${bookId}`);
            if (res.ok) {
                const reviews = await res.json();
                const mine = reviews.find(r => r.review_id === Number(reviewId));
                if (mine) {
                    _setModalStars(mine.rating);
                    document.getElementById("reviewModalComment").value = mine.review_comment;
                }
            }
        } catch { /* non-fatal */ }
    } else {
        _reviewModal.reviewId = null;
    }

    document.getElementById("reviewModal").classList.remove("hidden");
}
