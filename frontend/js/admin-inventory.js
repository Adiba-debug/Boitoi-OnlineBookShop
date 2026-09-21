const API_BASE = "http://localhost:5000/api";

const user = JSON.parse(localStorage.getItem("user"));
const isSuperAdmin = user?.role === "superadmin";

// ===============================
// GET ADMIN TOKEN
// ===============================

function getToken() {
    return localStorage.getItem("token");
}

// ===============================
// AUTH HEADER
// ===============================

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
    };
}

// ===============================
// LOAD BOOKS
// ===============================

async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE}/books`);

        if (!response.ok) {
            throw new Error("Failed to load books");
        }

        const books = await response.json();

        const tableBody = document.getElementById("booksTableBody");

        tableBody.innerHTML = "";

        books.forEach((book) => {
            const row = document.createElement("tr");

            row.className = "border-b";

            row.innerHTML = `
            <td class="p-3">${book.book_id}</td>

            <td class="p-3 font-semibold">
                ${book.title}
            </td>

            <td class="p-3">
                ৳${book.price}
            </td>

            <td class="p-3">
                ${book.stock}
            </td>
            <td class="p-3">
    ${book.image_url
                    ? `<img
            src="${book.image_url}"
            alt="${book.title}"
            class="w-16 h-20 object-cover rounded"
          >`
                    : "No image"
                }
                </td>

<td class="p-3">
    ${isSuperAdmin
                    ? `<span class="text-gray-500">View only</span>`
                    : `
                <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                    Edit
                </button>

                <button
                    class="bg-red-600 text-white px-3 py-1 rounded"
                >
                    Delete
                </button>
            `
                }
</td>
        `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error(error);

        alert("Cannot load books");
    }
}

// ===============================
// LOAD AUTHORS
// ===============================

async function loadAuthors() {
    try {
        const response = await fetch(`${API_BASE}/authors`);

        if (!response.ok) {
            throw new Error("Failed to load authors");
        }

        const authors = await response.json();

        const tableBody = document.getElementById("authorsTableBody");

        tableBody.innerHTML = "";

        authors.forEach((author) => {
            const row = document.createElement("tr");

            row.className = "border-b";

            row.innerHTML = `
            <td class="p-3">
                ${author.author_id}
            </td>

            <td class="p-3">
    ${author.image_url
                    ? `<img
            src="${author.image_url}"
            alt="${author.author_name}"
            class="w-16 h-16 object-cover rounded-full"
          >`
                    : "No image"
                }
</td>

            <td class="p-3 font-semibold">
                ${author.author_name}
            </td>

            <td class="p-3">
                ${author.book_count}
            </td>

            <td class="p-3">
    ${isSuperAdmin
                    ? `<span class="text-gray-500">View only</span>`
                    : `
                <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                    Edit
                </button>

                <button
                    class="bg-red-600 text-white px-3 py-1 rounded"
                >
                    Delete
                </button>
            `
                }
</td>
        `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error(error);

        alert("Cannot load authors");
    }
}

// ===============================
// LOAD PUBLISHERS
// ===============================

async function loadPublishers() {
    try {
        const response = await fetch(`${API_BASE}/publishers`);

        if (!response.ok) {
            throw new Error("Failed to load publishers");
        }

        const publishers = await response.json();

        const tableBody = document.getElementById("publishersTableBody");

        tableBody.innerHTML = "";

        publishers.forEach((publisher) => {
            const row = document.createElement("tr");

            row.className = "border-b";

            row.innerHTML = `
            <td class="p-3">
                ${publisher.publisher_id}
            </td>

            <td class="p-3 font-semibold">
                ${publisher.publisher_name}
            </td>
            <td class="p-3">
    ${publisher.logo_url
                    ? `<img
            src="${publisher.logo_url}"
            alt="${publisher.publisher_name}"
            class="w-16 h-16 object-contain rounded"
          >`
                    : "No logo"
                }
</td>

            <td class="p-3">
                ${publisher.description || "-"}
            </td>

            <td class="p-3">
    ${isSuperAdmin
                    ? `<span class="text-gray-500">View only</span>`
                    : `
                <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                    Edit
                </button>

                <button
                    class="bg-red-600 text-white px-3 py-1 rounded"
                >
                    Delete
                </button>
            `
                }
</td>
        `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error(error);

        alert("Cannot load publishers");
    }
}

// ===============================
// LOAD CATEGORIES
// ===============================

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);

        if (!response.ok) {
            throw new Error("Failed to load categories");
        }

        const categories = await response.json();

        const tableBody = document.getElementById("categoriesTableBody");

        tableBody.innerHTML = "";

        categories.forEach((category) => {
            const row = document.createElement("tr");

            row.className = "border-b";

            row.innerHTML = `
            <td class="p-3">
                ${category.category_id}
            </td>

            <td class="p-3 font-semibold">
                ${category.category_name}
            </td>

            <td class="p-3">
    ${isSuperAdmin
                    ? `<span class="text-gray-500">View only</span>`
                    : `
                <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                    Edit
                </button>

                <button
                    class="bg-red-600 text-white px-3 py-1 rounded"
                >
                    Delete
                </button>
            `
                }
</td>
        `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error(error);

        alert("Cannot load categories");
    }
}

// ===============================
// TAB SWITCHING
// ===============================

const sections = {
    books: document.getElementById("booksSection"),
    authors: document.getElementById("authorsSection"),
    publishers: document.getElementById("publishersSection"),
    categories: document.getElementById("categoriesSection"),
};

function showSection(sectionName) {
    Object.values(sections).forEach((section) => {
        section.classList.add("hidden");
    });

    sections[sectionName].classList.remove("hidden");
}

// Books tab
document.getElementById("booksTab").addEventListener("click", () => {
    showSection("books");

    loadBooks();
});

// Authors tab
document.getElementById("authorsTab").addEventListener("click", () => {
    showSection("authors");

    loadAuthors();
});

// Publishers tab
document.getElementById("publishersTab").addEventListener("click", () => {
    showSection("publishers");

    loadPublishers();
});

// Categories tab
document.getElementById("categoriesTab").addEventListener("click", () => {
    showSection("categories");

    loadCategories();
});

// ===============================
// LOGOUT
// ===============================

document.getElementById("logoutBtn").addEventListener("click", async () => {
    const token = getToken();

    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        console.error(error);
    }

    localStorage.removeItem("token");

    window.location.href = "login.html";
});

// ===============================
// INITIAL LOAD
// ===============================

loadBooks();
