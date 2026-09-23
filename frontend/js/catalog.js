// =========================
// Auth UI
// =========================

(function initAuthUI() {
    const user = JSON.parse(localStorage.getItem("user"));
    const userName = document.getElementById("userName");
    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");
    const logoutBtn = document.getElementById("logoutBtn");

    if (user) {
        if (userName) userName.textContent = "Hi, " + user.name;
        if (loginLink) loginLink.style.display = "none";
        if (registerLink) registerLink.style.display = "none";
        if (logoutBtn) logoutBtn.classList.remove("hidden");
    } else {
        if (userName) userName.textContent = "";
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
})();


// =========================
// Reusable Book Card
// =========================

function renderBookCard(book) {

    const user = JSON.parse(localStorage.getItem("user"));

    const isAdmin =
        user?.role === "admin" ||
        user?.role === "superadmin";

    const card = document.createElement("div");

    card.className =
        "border rounded-lg p-4 shadow bg-white cursor-pointer hover:shadow-lg transition";

    const img =
        book.image_url ||
        "https://via.placeholder.com/200x280?text=No+Cover";

    const outOfStock = Number(book.stock) === 0;

    card.innerHTML = `
        <img
            src="${img}"
            alt="${book.title}"
            class="w-full h-80 object-contain bg-gray-50 rounded mb-3"
        >

        <h3 class="font-bold text-base leading-tight mb-1 line-clamp-2">
            ${book.title}
        </h3>

        <p class="text-blue-600 font-semibold">
            ${book.price} Tk
        </p>

        <p class="text-sm text-gray-500 mb-3">
            ${
                outOfStock
                    ? '<span class="text-red-500 font-semibold">Out of Stock</span>'
                    : `Stock: ${book.stock}`
            }
        </p>

        ${
            !isAdmin
                ? `
                    <button
                        class="add-to-cart-btn w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition
                               ${outOfStock ? "opacity-50 cursor-not-allowed" : ""}"
                        ${outOfStock ? "disabled" : ""}
                    >
                        ${outOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                  `
                : ""
        }
    `;


    // =========================
    // Card click → book details
    // =========================

    card.addEventListener("click", function () {

        window.location.href =
            `book-details.html?id=${book.book_id}`;

    });


    // =========================
    // Add to Cart
    // =========================

    const addToCartBtn =
        card.querySelector(".add-to-cart-btn");

    if (addToCartBtn) {

        addToCartBtn.addEventListener("click", function (e) {

            e.stopPropagation();

            if (!outOfStock) {
                addToCart(book);
            }

        });

    }


    return card;
}

// =========================
// Render Book Grid
// =========================

function renderBooks(books, heading, breadcrumbParentText, breadcrumbParentAction) {
    const grid = document.getElementById("bookGrid");
    const noBooksMsg = document.getElementById("noBooksMsg");
    const sectionHeading = document.getElementById("sectionHeading");
    const breadcrumbParent = document.getElementById("breadcrumbParent");
    const breadcrumbSep = document.getElementById("breadcrumbSep");
    const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");

    sectionHeading.textContent = heading;
    document.title = heading + " - Boitoi BookShop";

    if (breadcrumbParentText) {
        breadcrumbParent.textContent = breadcrumbParentText;
        breadcrumbParent.onclick = breadcrumbParentAction || null;
        breadcrumbSep.classList.remove("hidden");
        breadcrumbCurrent.textContent = heading;
    } else {
        breadcrumbCurrent.textContent = heading;
    }

    grid.innerHTML = "";

    if (!books || books.length === 0) {
        noBooksMsg.classList.remove("hidden");
        return;
    }

    noBooksMsg.classList.add("hidden");
    books.forEach(book => grid.appendChild(renderBookCard(book)));
}


// =========================
// Load Catalog Based on URL params
// =========================

async function loadCatalog() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const id = params.get("id");
    const q = params.get("q");

    try {
        if (type === "category" && id) {
            const res = await fetch(`http://localhost:5000/api/books/category/${id}`);
            if (res.status === 404) {
                renderBooks([], "Category Not Found");
                return;
            }
            const data = await res.json();
            renderBooks(
                data.books,
                `Books in ${data.label}`,
                "Categories",
                () => {
                    window.location.href = "index.html";
                    // parent will re-trigger categories section via hash
                    sessionStorage.setItem("showSection", "categories");
                }
            );

        } else if (type === "author" && id) {
            const res = await fetch(`http://localhost:5000/api/books/author/${id}`);
            if (res.status === 404) {
                renderBooks([], "Author Not Found");
                return;
            }
            const data = await res.json();
            renderBooks(
                data.books,
                `Books by ${data.label}`,
                "Authors",
                () => {
                    sessionStorage.setItem("showSection", "authors");
                    window.location.href = "index.html";
                }
            );

        } else if (type === "publisher" && id) {
            const res = await fetch(`http://localhost:5000/api/books/publisher/${id}`);
            if (res.status === 404) {
                renderBooks([], "Publisher Not Found");
                return;
            }
            const data = await res.json();
            renderBooks(
                data.books,
                `Books by ${data.label}`,
                "Publishers",
                () => {
                    sessionStorage.setItem("showSection", "publishers");
                    window.location.href = "index.html";
                }
            );

        } else if (q) {
            const res = await fetch(`http://localhost:5000/api/books/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            renderBooks(
                Array.isArray(data) ? data : [],
                `Search Results for "${q}"`,
                null,
                null
            );

        } else {
            document.getElementById("sectionHeading").textContent = "Invalid catalog request.";
        }

    } catch (err) {
        console.error("Catalog load error:", err);
        document.getElementById("sectionHeading").textContent = "Failed to load catalog.";
    }
}


// =========================
// Search from catalog page
// =========================

document.addEventListener("DOMContentLoaded", function () {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");

    // Pre-fill search box if ?q= is in URL
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && searchInput) searchInput.value = q;

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

    loadCatalog();
});
