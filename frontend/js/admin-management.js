const user = JSON.parse(localStorage.getItem("user"));


// Login check
if (!user) {
    window.location.href = "login.html";
}


// শুধু Superadmin এই page access করতে পারবে
if (user.role !== "superadmin") {
    window.location.href = "admin-dashboard.html";
}


// Superadmin name
document.getElementById("adminName").textContent = user.name;


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

const API_BASE = "http://localhost:5000/api";


// Load Admins
async function loadAdmins() {

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(
            `${API_BASE}/auth/admins`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load admins");
        }

        const admins = await response.json();

        const tableBody = document.getElementById("adminTableBody");

        tableBody.innerHTML = "";

        admins.forEach(admin => {

            const row = document.createElement("tr");

            row.className = "border-t";

            row.innerHTML = `
                <td class="p-3">${admin.user_id}</td>
                <td class="p-3">${admin.name}</td>
                <td class="p-3">${admin.email}</td>
                <td class="p-3">${admin.role}</td>
                <td class="p-3">
                    ${
                        admin.role === "admin"
                            ? `
                                <button
                                    class="bg-red-600 text-white px-3 py-1 rounded"
                                    data-id="${admin.user_id}"
                                >
                                    Remove
                                </button>
                              `
                            : `
                                <span class="text-gray-500">
                                    Protected
                                </span>
                              `
                    }
                </td>
            `;

            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error(error);

    }
}


// Load admins when page opens
loadAdmins();