// =========================
// Register Form
// =========================

document
    .getElementById("registerForm")
    ?.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone_number = document.getElementById("phone_number").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone_number, password }),
            });
            const data = await response.json();
            alert(data.message);
        } catch (error) {
            console.log(error);
            alert("Something went wrong!");
        }
    });


// =========================
// Login Form
// =========================

document
    .getElementById("loginForm")
    ?.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            alert(data.message);

            if (data.message === "Login successful") {
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.token);
                window.location.href = "index.html";
            }
        } catch (error) {
            console.log(error);
            alert("Something went wrong!");
        }
    });


// =========================
// Auth UI
// =========================

const user = JSON.parse(localStorage.getItem("user"));
const userName = document.getElementById("userName");
const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");
const logoutBtn = document.getElementById("logoutBtn");

if (user && userName) {
    userName.innerHTML = "Hi, " + user.name;
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (logoutBtn) logoutBtn.classList.remove("hidden");
} else {
    if (userName) userName.innerHTML = "";
    if (loginLink) loginLink.style.display = "inline";
    if (registerLink) registerLink.style.display = "inline";
    if (logoutBtn) logoutBtn.classList.add("hidden");
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        alert("Logged out successfully!");
        window.location.href = "index.html";
    });
}


// =========================
// Reusable Book Card
// =========================

function renderBookCard(book) {
    const card = document.createElement("div");
    card.className =
        "border rounded-lg p-4 shadow bg-white cursor-pointer hover:shadow-lg transition";

    const img = book.image_url || "https://via.placeholder.com/200x280?text=No+Cover";
    const outOfStock = Number(book.stock) === 0;

    card.innerHTML = `
        <img src="${img}" alt="${book.title}"
            class="w-full h-80 object-contain bg-gray-50 rounded mb-3">
        <h3 class="font-bold text-base leading-tight mb-1 line-clamp-2">${book.title}</h3>
        <p class="text-blue-600 font-semibold">${book.price} Tk</p>
        <p class="text-sm text-gray-500 mb-3">
            ${outOfStock ? '<span class="text-red-500 font-semibold">Out of Stock</span>' : `Stock: ${book.stock}`}
        </p>
        <button
            class="add-to-cart-btn w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition
                   ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}"
            ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
    `;

    card.addEventListener("click", function () {
        window.location.href = `book-details.html?id=${book.book_id}`;
    });

    card.querySelector(".add-to-cart-btn").addEventListener("click", function (e) {
        e.stopPropagation();
        if (!outOfStock) addToCart(book);
    });

    return card;
}


// =========================
// Load Popular Books
// =========================

async function loadBooks() {
    try {
        const response = await fetch("http://localhost:5000/api/books");
        const books = await response.json();

        const container = document.getElementById("bookContainer");
        if (!container) return;

        container.innerHTML = "";
        container.className =
            "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";

        const heading = document.querySelector("#bookContainer")
            ?.closest("section")?.querySelector("h2");
        if (heading) heading.textContent = "Popular Books";

        books.forEach(book => container.appendChild(renderBookCard(book)));

    } catch (error) {
        console.log(error);
    }
}


// =========================
// Biography / Detail Modal
// =========================

function openDetailModal(name, photo, text) {
    const existing = document.getElementById("detailModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "detailModal";
    modal.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-lg w-full p-6 relative max-h-[80vh] overflow-y-auto">
            <button id="closeDetailModal"
                class="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl leading-none">&times;</button>
            <img src="${photo}" class="w-28 h-28 object-cover rounded-full mx-auto mb-4">
            <h3 class="text-xl font-bold text-center mb-3">${name}</h3>
            <p class="text-gray-700 whitespace-pre-line">${text}</p>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById("closeDetailModal").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}


// =========================
// Fetch & Display: Categories / Authors / Publishers
// =========================

async function fetchAndDisplay(type) {
    try {
        const response = await fetch(`http://localhost:5000/api/${type}`);
        const data = await response.json();

        const container = document.getElementById("bookContainer");
        if (!container) return;

        container.innerHTML = "";
        container.className =
            "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";

        const sectionHeading = container.closest("section")?.querySelector("h2");
        const titleName =
            type === "categories"
                ? "All Categories"
                : type === "authors"
                ? "All Authors"
                : "All Publishers";

        if (sectionHeading) sectionHeading.textContent = titleName;

        let html = "";

        if (type === "authors") {
            data.forEach((author, index) => {
                const photo =
                    author.image_url ||
                    "https://via.placeholder.com/150x150?text=No+Photo";
                const bio = author.bio || "No biography available.";

                html += `
                    <div data-index="${index}" class="author-card cursor-pointer border rounded-lg p-5 shadow bg-white text-center hover:shadow-lg transition">
                        <img src="${photo}" class="w-24 h-24 object-cover rounded-full mx-auto mb-3">
                        <h3 class="text-base font-bold leading-tight mb-1">${author.author_name}</h3>
                        <p class="text-blue-600 text-sm font-semibold mb-1">📚 ${author.book_count} Books</p>
                        <p class="text-gray-600 text-xs mt-1 line-clamp-3">${bio}</p>
                        <div class="flex gap-2 mt-3 justify-center">
                            <button data-index="${index}" class="view-author-books bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">
                                View Books
                            </button>
                            <button data-index="${index}" class="view-author-bio bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded hover:bg-gray-300">
                                Biography
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

            container.querySelectorAll(".view-author-books").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const author = data[btn.dataset.index];
                    window.location.href = `catalog.html?type=author&id=${author.author_id}`;
                });
            });

            container.querySelectorAll(".view-author-bio").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const author = data[btn.dataset.index];
                    const photo =
                        author.image_url ||
                        "https://via.placeholder.com/150x150?text=No+Photo";
                    openDetailModal(author.author_name, photo, author.bio || "No biography available.");
                });
            });

            // Clicking the card itself also navigates to books
            container.querySelectorAll(".author-card").forEach((card) => {
                card.addEventListener("click", () => {
                    const author = data[card.dataset.index];
                    window.location.href = `catalog.html?type=author&id=${author.author_id}`;
                });
            });

        } else if (type === "publishers") {
            data.forEach((pub, index) => {
                const logo =
                    pub.logo_url ||
                    "https://via.placeholder.com/150x150?text=No+Logo";
                const desc = pub.description || "No description available.";

                html += `
                    <div data-index="${index}" class="publisher-card cursor-pointer border rounded-lg p-5 shadow bg-white text-center hover:shadow-lg transition">
                        <img src="${logo}" class="w-24 h-24 object-cover rounded-full mx-auto mb-3">
                        <h3 class="text-base font-bold leading-tight mb-1">${pub.publisher_name}</h3>
                        <p class="text-gray-600 text-xs mt-1 line-clamp-3">${desc}</p>
                        <button data-index="${index}" class="view-pub-books mt-3 bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">
                            View Books
                        </button>
                    </div>
                `;
            });

            container.innerHTML = html;

            container.querySelectorAll(".view-pub-books").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const pub = data[btn.dataset.index];
                    window.location.href = `catalog.html?type=publisher&id=${pub.publisher_id}`;
                });
            });

            container.querySelectorAll(".publisher-card").forEach((card) => {
                card.addEventListener("click", () => {
                    const pub = data[card.dataset.index];
                    window.location.href = `catalog.html?type=publisher&id=${pub.publisher_id}`;
                });
            });

        } else {
            // Categories
            data.forEach((item) => {
                const name = item.category_name || item.name;
                html += `
                    <div data-id="${item.category_id}" class="category-card cursor-pointer bg-white p-6 rounded shadow text-center
                        flex items-center justify-center min-h-[100px] hover:shadow-lg hover:bg-blue-50 transition">
                        <h3 class="font-bold text-lg text-gray-800">${name}</h3>
                    </div>
                `;
            });

            container.innerHTML = html;

            container.querySelectorAll(".category-card").forEach((card) => {
                card.addEventListener("click", () => {
                    window.location.href = `catalog.html?type=category&id=${card.dataset.id}`;
                });
            });
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}


// =========================
// Search
// =========================

document.addEventListener("DOMContentLoaded", function () {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", function () {
            const term = searchInput.value.trim();
            if (term) {
                window.location.href = `catalog.html?q=${encodeURIComponent(term)}`;
            }
        });

        searchInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") searchBtn.click();
        });
    }

    // If redirected from catalog.html with showSection in sessionStorage
    const showSection = sessionStorage.getItem("showSection");
    if (showSection) {
        sessionStorage.removeItem("showSection");
        fetchAndDisplay(showSection);
    } else {
        loadBooks();
    }
});
