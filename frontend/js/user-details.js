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



        // =========================
        // Group items by Order ID
        // =========================

        const groupedOrders = {};


        orders.forEach(order => {

            if (!groupedOrders[order.order_id]) {

                groupedOrders[order.order_id] = {

                    order_id: order.order_id,
                    order_date: order.order_date,
                    total_amount: order.total_amount,
                    status: order.status,
                    payment_method: order.payment_method,
                    items: []

                };

            }


            groupedOrders[order.order_id].items.push({

                book_id: order.book_id,
                title: order.title,
                image_url: order.image_url,
                quantity: order.quantity,
                unit_price: order.unit_price

            });

        });



        // =========================
        // Display Orders
        // =========================

        ordersContainer.innerHTML = "";


        Object.values(groupedOrders).forEach(order => {


            const orderCard = document.createElement("div");

            orderCard.className =
                "bg-white rounded-lg shadow p-6 mb-6";


            let itemsHTML = "";


            order.items.forEach(item => {

                itemsHTML += `

                    <div class="flex items-center border-b py-4">

                        <img
                            src="${item.image_url}"
                            class="w-16 h-20 object-cover rounded mr-4"
                        >

                        <div class="flex-1">

                            <h4 class="font-bold text-lg">
                                ${item.title}
                            </h4>

                            <p class="text-gray-600">
                                Quantity: ${item.quantity}
                            </p>

                            <p class="text-gray-600">
                                Price: ${item.unit_price} Tk
                            </p>

                        </div>

                    </div>

                `;

            });



            orderCard.innerHTML = `

                <div class="flex justify-between items-center mb-4">

                    <div>

                        <h3 class="text-xl font-bold">
                            Order #${order.order_id}
                        </h3>

                        <p class="text-gray-500">
                            ${new Date(order.order_date).toLocaleString()}
                        </p>

                    </div>


                    <span class="px-4 py-2 rounded bg-blue-100 text-blue-700 font-bold">
                        ${order.status}
                    </span>

                </div>


                <div>

                    ${itemsHTML}

                </div>


                <div class="mt-4 flex justify-between">

                    <p>
                        Payment:
                        <span class="font-bold">
                            ${order.payment_method || "COD"}
                        </span>
                    </p>


                    <p class="text-xl font-bold">
                        Total:
                        ${order.total_amount} Tk
                    </p>

                </div>

            `;


            ordersContainer.appendChild(orderCard);

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