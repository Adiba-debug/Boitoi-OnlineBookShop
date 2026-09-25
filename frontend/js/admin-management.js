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
    window.location.href = "index.html";
}


// =========================
// API Base
// =========================

const API_BASE = "http://localhost:5000/api";
const adminName = document.getElementById("adminName");

// =========================
// Superadmin Name
// =========================

if (adminName && user) {
    adminName.innerText = `Hi, ${user.name} 👋`;
}

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
// Load Admins
// =========================

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

        const tableBody =
            document.getElementById("adminTableBody");


        tableBody.innerHTML = "";


        admins.forEach(admin => {

            const row = document.createElement("tr");

            row.className = "border-t";


            row.innerHTML = `

                <td class="p-3">
                    ${admin.user_id}
                </td>

                <td class="p-3">
                    ${admin.name}
                </td>

                <td class="p-3">
                    ${admin.email}
                </td>
                <td class="p-3">${admin.phone_number || "-"}</td>

                <td class="p-3">
                    ${admin.role}
                </td>

                <td class="p-3">

                    ${admin.role === "admin"

                    ? `
                                <button
                                    class="removeAdminBtn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
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


            // Remove button
            const removeButton =
                row.querySelector(".removeAdminBtn");


            if (removeButton) {

                removeButton.addEventListener("click", () => {

                    removeAdmin(admin.user_id);

                });

            }

        });


    } catch (error) {

        console.error("Load admins error:", error);

        alert("Cannot load admins");

    }

}


// =========================
// Remove Admin
// =========================

async function removeAdmin(adminId) {

    const confirmed = confirm(
        "Are you sure you want to remove this admin?"
    );


    if (!confirmed) {
        return;
    }


    const token = localStorage.getItem("token");


    try {

        const response = await fetch(
            `${API_BASE}/auth/admins/${adminId}`,
            {
                method: "DELETE",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to remove admin"
            );

            return;

        }


        alert("Admin removed successfully");


        // Refresh admin list
        loadAdmins();


    } catch (error) {

        console.error("Remove admin error:", error);

        alert("Failed to remove admin");

    }

}


// =========================
// Add Admin Modal
// =========================

const addAdminBtn =
    document.getElementById("addAdminBtn");

const addAdminModal =
    document.getElementById("addAdminModal");

const addAdminForm =
    document.getElementById("addAdminForm");

const cancelAdminBtn =
    document.getElementById("cancelAdminBtn");


// =========================
// Open Modal
// =========================

addAdminBtn.addEventListener("click", () => {

    addAdminModal.classList.remove("hidden");

});


// =========================
// Close Modal
// =========================

cancelAdminBtn.addEventListener("click", () => {

    addAdminModal.classList.add("hidden");

});


// =========================
// Add Admin
// =========================

addAdminForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const token = localStorage.getItem("token");


    const name =
        document.getElementById("adminNameInput").value.trim();


    const email =
        document.getElementById("adminEmailInput").value.trim();

    const phone_number = document.getElementById("adminPhoneInput").value;

    const password =
        document.getElementById("adminPasswordInput").value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {
        alert(
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
        );
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE}/auth/admins`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    name,
                    email,
                    phone_number,
                    password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to add admin"
            );

            return;

        }


        alert("Admin added successfully");


        // Clear form
        addAdminForm.reset();


        // Close modal
        addAdminModal.classList.add("hidden");


        // Refresh admin list
        loadAdmins();


    } catch (error) {

        console.error("Add admin error:", error);

        alert("Failed to add admin");

    }

});


// =========================
// Load Admins When Page Opens
// =========================

loadAdmins();

