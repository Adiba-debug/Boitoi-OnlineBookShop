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

// Admin Management শুধু Superadmin-এর জন্য
const manageAdminsCard = document.getElementById("manageAdminsCard");

if (user.role !== "superadmin") {
    manageAdminsCard.classList.add("hidden");
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