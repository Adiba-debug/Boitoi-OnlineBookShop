async function loadCheckout() {
    const user = getLoggedInUser();
    const container = document.getElementById("checkoutContainer");
    container.innerHTML = "";

    if (!user) {
        container.innerHTML = `
            <div class="text-center bg-white p-10 rounded-lg shadow">
                <h3 class="text-2xl font-bold mb-4">Please login first 🔐</h3>
                <a href="login.html" class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">Login</a>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/cart/${user.user_id}`);
        if (!response.ok) throw new Error("Failed to load cart");

        const cart = await response.json();

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="text-center bg-white p-10 rounded-lg shadow">
                    <h3 class="text-2xl font-bold mb-4">Your cart is empty 🛒</h3>
                    <a href="index.html" class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">Continue Shopping</a>
                </div>
            `;
            return;
        }

        let subtotal = 0;

        let itemsHtml = "";
        cart.forEach((book) => {
            const itemSubtotal = Number(book.price) * Number(book.quantity);
            subtotal += itemSubtotal;

            itemsHtml += `
                <div class="flex justify-between py-1 text-sm text-gray-700">
                    <span>${book.title} × ${book.quantity}</span>
                    <span>${itemSubtotal} Tk</span>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-3xl font-bold mb-6 text-green-600 text-center">Checkout</h2>

                <div class="mb-4">
                    <label class="block font-semibold mb-2">Delivery Address</label>
                    <textarea id="shippingAddress" rows="3" class="w-full border rounded p-2"
                        placeholder="Enter your full delivery address..." spellcheck="false"></textarea>
                </div>

                <div class="mb-2 flex gap-2">
                    <input type="text" id="couponCode" placeholder="Enter coupon code" class="border rounded p-2 flex-1">
                    <button id="applyCouponBtn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Apply</button>
                </div>
                <p id="couponMessage" class="text-sm mb-4"></p>

                <div class="mb-4">
                    <label class="block font-semibold mb-2">Payment Method</label>
                    <div class="border rounded p-3 bg-gray-50">
                        <label class="flex items-center gap-2">
                            <input type="radio" name="paymentMethod" value="COD" checked>
                            Cash on Delivery (COD)
                        </label>
                    </div>
                </div>

                <div class="border-t pt-4">
                    <h4 class="font-bold mb-2">Order Summary</h4>
                    <div class="mb-3">${itemsHtml}</div>

                    <p class="text-gray-700">Subtotal: <span id="subtotalAmount">${subtotal}</span> Tk</p>
                    <p class="text-gray-700">Delivery Charge: 150 Tk</p>
                    <p id="discountLine" class="text-green-600 hidden">Discount: -<span id="discountAmount">0</span> Tk</p>

                    <h3 class="text-2xl font-bold mt-2">
                        Grand Total: <span id="grandTotalAmount">${subtotal + 150}</span> Tk
                    </h3>
                </div>

                <button id="confirmOrderBtn" class="bg-blue-600 text-white px-6 py-3 rounded mt-4 hover:bg-blue-700 w-full">
                    Confirm Order
                </button>
            </div>
        `;

        let appliedCoupon = null;

        const applyCouponBtn = document.getElementById("applyCouponBtn");
        const couponMessage = document.getElementById("couponMessage");
        const discountLine = document.getElementById("discountLine");
        const discountAmountEl = document.getElementById("discountAmount");
        const grandTotalEl = document.getElementById("grandTotalAmount");

        function recalcGrandTotal() {
            const discount = appliedCoupon ? appliedCoupon.discount_value : 0;
            const grandTotal = subtotal - discount + 150;

            grandTotalEl.innerText = grandTotal < 0 ? 0 : grandTotal;

            if (appliedCoupon) {
                discountAmountEl.innerText = discount;
                discountLine.classList.remove("hidden");
            } else {
                discountLine.classList.add("hidden");
            }
        }

        applyCouponBtn.addEventListener("click", async function () {
            const couponCode = document.getElementById("couponCode").value.trim();

            if (!couponCode) {
                couponMessage.className = "text-sm mb-4 text-red-500";
                couponMessage.innerText = "Please enter a coupon code";
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/api/orders/apply-coupon", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ coupon_code: couponCode, subtotal: subtotal, user_id: user.user_id }),
                });

                const data = await response.json();

                if (!response.ok) {
                    appliedCoupon = null;
                    couponMessage.className = "text-sm mb-4 text-red-500";
                    couponMessage.innerText = data.message || "Failed to apply coupon";
                    recalcGrandTotal();
                    return;
                }

                appliedCoupon = { coupon_id: data.coupon_id, discount_value: data.discount_value };

                couponMessage.className = "text-sm mb-4 text-green-600";
                couponMessage.innerText = `Coupon applied! You saved ${data.discount_value} Tk`;

                recalcGrandTotal();

            } catch (error) {
                console.error("Coupon apply error:", error);
                couponMessage.className = "text-sm mb-4 text-red-500";
                couponMessage.innerText = "Something went wrong!";
            }
        });

        const confirmOrderBtn = document.getElementById("confirmOrderBtn");

        confirmOrderBtn.addEventListener("click", async function () {
            const shippingAddress = document.getElementById("shippingAddress").value.trim();

            if (!shippingAddress) {
                alert("Please enter your delivery address!");
                return;
            }

            confirmOrderBtn.disabled = true;
            confirmOrderBtn.innerText = "Placing order...";

            try {
                const response = await fetch("http://localhost:5000/api/orders/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: user.user_id,
                        payment_method: "COD",
                        shipping_address: shippingAddress,
                        coupon_id: appliedCoupon ? appliedCoupon.coupon_id : null,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message || "Failed to place order");
                    confirmOrderBtn.disabled = false;
                    confirmOrderBtn.innerText = "Confirm Order";
                    return;
                }

                window.location.href = `OrderSuccess.html?order_id=${data.order_id}`;

            } catch (error) {
                console.error("Checkout error:", error);
                alert("Something went wrong while placing the order!");
                confirmOrderBtn.disabled = false;
                confirmOrderBtn.innerText = "Confirm Order";
            }
        });

    } catch (error) {
        console.error("Checkout loading error:", error);
        container.innerHTML = `<p class="text-center text-red-500">Failed to load checkout page.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadCheckout();
});