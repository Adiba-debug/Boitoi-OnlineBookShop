const user = JSON.parse(localStorage.getItem("user"));


// =========================
// Login Check
// =========================

if (!user) {
    window.location.href = "login.html";
}


// =========================
// Superadmin Only
// =========================

if (user.role !== "superadmin") {
    window.location.href = "admin-dashboard.html";
}


// =========================
// Superadmin Name
// =========================

document.getElementById("adminName").textContent = user.name;


// =========================
// Logout
// =========================

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

// =========================
// API Base
// =========================

const API_BASE = "http://localhost:5000/api";


// =========================
// Load Customers
// =========================

async function loadUsers() {

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(
            `${API_BASE}/auth/users`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load users");
        }

        const users = await response.json();

        const tableBody = document.getElementById("userTableBody");

        tableBody.innerHTML = "";

        users.forEach(user => {

            const row = document.createElement("tr");

            row.className = "border-t";

            row.innerHTML = `
                <td class="p-3">${user.user_id}</td>

                <td class="p-3">
                    ${user.name}
                </td>

                <td class="p-3">
                    ${user.email}
                </td>

                <td class="p-3">
                    ${user.phone_number || "N/A"}
                </td>

                <td class="p-3">
                    ${
                        user.is_blocked
                            ? `<span class="text-red-600 font-semibold">Blocked</span>`
                            : `<span class="text-green-600 font-semibold">Active</span>`
                    }
                </td>

                <td class="p-3">

                    ${
                        user.is_blocked
                            ? `
                                <button
                                    class="unblockBtn bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    data-id="${user.user_id}"
                                >
                                    Unblock
                                </button>
                              `
                            : `
                                <button
                                    class="blockBtn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    data-id="${user.user_id}"
                                >
                                    Block
                                </button>
                              `
                    }

                </td>
            `;

            tableBody.appendChild(row);

        });


        // =========================
        // Block Buttons
        // =========================

        document.querySelectorAll(".blockBtn").forEach(button => {

            button.addEventListener("click", () => {
                blockUser(button.dataset.id);
            });

        });


        // =========================
        // Unblock Buttons
        // =========================

        document.querySelectorAll(".unblockBtn").forEach(button => {

            button.addEventListener("click", () => {
                unblockUser(button.dataset.id);
            });

        });

    } catch (error) {

        console.error(error);

        alert("Cannot load users");

    }

}


// =========================
// Block User
// =========================

async function blockUser(userId) {

    if (!confirm("Are you sure you want to block this user?")) {
        return;
    }

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(
            `${API_BASE}/auth/users/${userId}/block`,
            {
                method: "PATCH",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to block user");
            return;
        }

        alert("User blocked successfully");

        loadUsers();

    } catch (error) {

        console.error(error);

        alert("Failed to block user");

    }

}


// =========================
// Unblock User
// =========================

async function unblockUser(userId) {

    if (!confirm("Are you sure you want to unblock this user?")) {
        return;
    }

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(
            `${API_BASE}/auth/users/${userId}/unblock`,
            {
                method: "PATCH",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to unblock user");
            return;
        }

        alert("User unblocked successfully");

        loadUsers();

    } catch (error) {

        console.error(error);

        alert("Failed to unblock user");

    }

}


// =========================
// Load Users on Page Open
// =========================

loadUsers();