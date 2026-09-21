async function loadCart() {
    const user = getLoggedInUser();
    const container = document.getElementById("cartContainer");
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
        const response = await fetch(
            "http://localhost:5000/api/cart/",
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );
        if (!response.ok) throw new Error("Failed to load cart");

        const cart = await response.json();

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="text-center bg-white p-10 rounded-lg shadow">
                    <h3 class="text-2xl font-bold mb-4">Your cart is empty 🛒</h3>
                    <a href="index.html" class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">Continue Shopping</a>
                </div>
            `;
            await updateCartCount();
            return;
        }

        let total = 0;

        cart.forEach((book) => {
            const subtotal = Number(book.price) * Number(book.quantity);
            total += subtotal;

            const cartItem = document.createElement("div");
            cartItem.className = "bg-white p-5 rounded-lg shadow mb-4 flex items-center justify-between";

            cartItem.innerHTML = `
                <div class="flex items-center gap-5">
                    <img src="${book.image_url}" alt="${book.title}" class="w-24 h-32 object-cover rounded">
                    <div>
                        <h3 class="text-xl font-bold">${book.title}</h3>
                        <p class="text-gray-600">Price: ${book.price} Tk</p>
                        <div class="flex items-center gap-3 mt-3">
                            <button class="decrease-btn bg-gray-300 px-3 py-1 rounded">−</button>
                            <span class="font-bold">${book.quantity}</span>
                            <button class="increase-btn bg-gray-300 px-3 py-1 rounded">+</button>
                        </div>
                        <p class="font-bold mt-3">Subtotal: ${subtotal} Tk</p>
                        <button class="remove-btn bg-red-500 text-white px-4 py-2 rounded mt-3 hover:bg-red-600">Remove</button>
                    </div>
                </div>
            `;

            cartItem.querySelector(".increase-btn").addEventListener("click", async function () {
                await fetch("http://localhost:5000/api/cart/increase", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: user.user_id, book_id: book.book_id }),
                });
                loadCart();
            });

            cartItem.querySelector(".decrease-btn").addEventListener("click", async function () {
                await fetch("http://localhost:5000/api/cart/decrease", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: user.user_id, book_id: book.book_id }),
                });
                loadCart();
            });

            cartItem.querySelector(".remove-btn").addEventListener("click", async function () {
                await fetch("http://localhost:5000/api/cart/remove", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: user.user_id, book_id: book.book_id }),
                });
                loadCart();
            });

            container.appendChild(cartItem);
        });

        // Total + Proceed to Payment
        const totalDiv = document.createElement("div");
        totalDiv.className = "bg-white p-6 rounded-lg shadow mt-6 text-right";
        totalDiv.innerHTML = `
            <h3 class="text-2xl font-bold">Total: ${total} Tk</h3>

            <a href="index.html" class="inline-block bg-gray-600 text-white px-6 py-3 rounded mt-4 mr-2 hover:bg-gray-700">
                Add More Items
            </a>

            <button id="proceedBtn" class="bg-blue-600 text-white px-6 py-3 rounded mt-4 hover:bg-blue-700">
                Proceed to Payment
            </button>
        `;
        container.appendChild(totalDiv);

        totalDiv.querySelector("#proceedBtn").addEventListener("click", function () {
            window.location.href = "checkout.html";
        });

        await updateCartCount();

    } catch (error) {
        console.error("Cart loading error:", error);
        container.innerHTML = `<p class="text-center text-red-500">Failed to load cart.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadCart();
});