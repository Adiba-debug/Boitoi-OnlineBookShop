const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "login.html";
}

// Admin বা Superadmin ছাড়া কেউ dashboard access করতে পারবে না
if (user.role !== "admin" && user.role !== "superadmin") {
    window.location.href = "index.html";
}


// Admin name
document.getElementById("adminName").textContent = user.name;
async function loadDashboardStats() {

    try {

        const token = localStorage.getItem("token");

        const headers = {
            Authorization: `Bearer ${token}`
        };

        // Books
        const booksResponse =
            await fetch("http://localhost:5000/api/books");

        const books = await booksResponse.json();

        document.getElementById("bookCount").textContent =
            books.length;


        // Total Sold Books
        const totalSold = books.reduce(
            (sum, book) => sum + Number(book.total_sold || 0),
            0
        );

        document.getElementById("totalSoldCount").textContent =
            totalSold;


        // Orders
        const ordersResponse =
            await fetch("http://localhost:5000/api/orders", {
                headers
            });

        const orders = await ordersResponse.json();

        document.getElementById("orderCount").textContent =
            orders.length;


        // Authors
        const authorsResponse =
            await fetch("http://localhost:5000/api/authors");

        const authors = await authorsResponse.json();

        document.getElementById("authorCount").textContent =
            authors.length;


        // Publishers
        const publishersResponse =
            await fetch("http://localhost:5000/api/publishers");

        const publishers = await publishersResponse.json();

        document.getElementById("publisherCount").textContent =
            publishers.length;


        // Categories
        const categoriesResponse =
            await fetch("http://localhost:5000/api/categories");

        const categories = await categoriesResponse.json();

        document.getElementById("categoryCount").textContent =
            categories.length;

    } catch (error) {

        console.error("Dashboard statistics error:", error);

    }
}

loadDashboardStats();
document.getElementById("adminDetailName").textContent =
    user.name || "-";

document.getElementById("adminDetailEmail").textContent =
    user.email || "-";

document.getElementById("adminDetailPhone").textContent =
    user.phone_number || "-";

document.getElementById("adminDetailRole").textContent =
    user.role || "-";


// Dashboard button text based on role
const inventoryBtn = document.getElementById("inventoryBtn");
const ordersBtn = document.getElementById("ordersBtn");

if (user.role === "superadmin") {
    inventoryBtn.textContent = "View Inventory";
    ordersBtn.textContent = "View Orders";
} else {
    inventoryBtn.textContent = "Manage Inventory";
    ordersBtn.textContent = "Manage Orders";
}

// Admin Management for Superadmin only
const manageAdminsCard = document.getElementById("manageAdminsCard");
const manageUsersCard = document.getElementById("manageUsersCard");

if (user.role !== "superadmin") {
    manageAdminsCard.classList.add("hidden");
    manageUsersCard.classList.add("hidden");
}


// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {

    const token = localStorage.getItem("token");

    try {
        await fetch("http://localhost:5000/api/auth/logout", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error(error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
});
// Inventory button
document.getElementById("inventoryBtn").addEventListener("click", () => {
    window.location.href = "admin-inventory.html";
});


// Orders button
document.getElementById("ordersBtn").addEventListener("click", () => {
    window.location.href = "admin-orders.html";
});
document.getElementById("adminsBtn").addEventListener("click", () => {
    window.location.href = "admin-management.html";
});
document.getElementById("usersBtn").addEventListener("click", () => {
    window.location.href = "user-management.html";
});
