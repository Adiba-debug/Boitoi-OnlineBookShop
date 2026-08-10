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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone_number,
                    password,
                }),
            });

            const data = await response.json();

            alert(data.message);
        } catch (error) {
            console.log(error);
            alert("Something went wrong!");
        }
    });

document
    .getElementById("loginForm")
    ?.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            alert(data.message);

            if (data.message === "Login successful") {
                localStorage.setItem("user", JSON.stringify(data.user));

                window.location.href = "index.html";
            }
        } catch (error) {
            console.log(error);
            alert("Something went wrong!");
        }
    });

const user = JSON.parse(localStorage.getItem("user"));
const userName = document.getElementById("userName");
const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");
const logoutBtn = document.getElementById("logoutBtn");

if (user && userName) {
    userName.innerHTML = "Hi, " + user.name;

    if (loginLink) {
        loginLink.style.display = "none";
    }
    if (registerLink) {
        registerLink.style.display = "none";
    }
    if (logoutBtn) {
        logoutBtn.classList.remove("hidden");
    }
} else {
    if (userName) {
        userName.innerHTML = "";
    }

    if (loginLink) {
        loginLink.style.display = "inline";
    }

    if (registerLink) {
        registerLink.style.display = "inline";
    }

    if (logoutBtn) {
        logoutBtn.classList.add("hidden");
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("user");

        alert("Logged out successfully!");

        window.location.href = "index.html";
    });
}

async function loadBooks() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/books"
        );

        const books = await response.json();

        const container =
            document.getElementById("bookContainer");

        container.innerHTML = "";

        books.forEach((book) => {

            const card =
                document.createElement("div");


            card.className =
                "border rounded-lg p-5 shadow bg-white";

            card.style.cursor = "pointer";


            // পুরো card click করলে details page
            card.addEventListener("click", function () {

                window.location.href =
                    `book-details.html?id=${book.book_id}`;

            });


            card.innerHTML = `

                <img
                    src="${book.image_url}"
                    class="w-60 h-100 object-cover mb-4"
                >

                <h3 class="text-xl font-bold">
                    ${book.title}
                </h3>

                <p class="text-gray-600">
                    Price: ${book.price} Tk
                </p>

                <p class="text-gray-500">
                    Stock: ${book.stock}
                </p>

                <button
                    class="add-to-cart-btn bg-blue-600 text-white px-4 py-2 rounded mt-4">

                    Add to Cart

                </button>

            `;


            // Add to Cart button
            const addToCartBtn =
                card.querySelector(".add-to-cart-btn");


            addToCartBtn.addEventListener(
                "click",
                function (e) {

                    // Card click আটকাবে
                    e.stopPropagation();

                    addToCart(book);

                }
            );


            container.appendChild(card);

        });

    }
    catch (error) {

        console.log(error);

    }

}


loadBooks();


// পুরো bio/description দেখানোর জন্য modal খোলার ফাংশন
function openDetailModal(name, photo, text) {
    const existing = document.getElementById("detailModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "detailModal";
    modal.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-lg w-full p-6 relative max-h-[80vh] overflow-y-auto">
            <button id="closeDetailModal" class="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl leading-none">&times;</button>
            <img src="${photo}" class="w-28 h-28 object-cover rounded-full mx-auto mb-4">
            <h3 class="text-xl font-bold text-center mb-3">${name}</h3>
            <p class="text-gray-700 whitespace-pre-line">${text}</p>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("closeDetailModal")
        .addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
}

async function fetchAndDisplay(type) {
    try {
        const response = await fetch(`http://localhost:5000/api/${type}`);
        const data = await response.json();

        const container = document.getElementById("bookContainer");
        container.innerHTML = "";
        container.className = "grid grid-cols-5 gap-4";

        let titleName =
            type === "categories"
                ? "Categories"
                : type.charAt(0).toUpperCase() + type.slice(1);

        const sectionHeading = document
            .querySelector("#bookContainer")
            ?.closest("section")
            ?.querySelector("h2");
        if (sectionHeading) {
            sectionHeading.innerText = `All ${titleName}`;
        }

        let html = "";

        if (type === "authors") {
            data.forEach((author, index) => {
                const photo =
                    author.image_url ||
                    "https://via.placeholder.com/150x150?text=No+Photo";
                const bio = author.bio || "No biography available.";

                html += `
                    <div data-index="${index}" class="author-card cursor-pointer border rounded-lg p-5 shadow bg-white text-center hover:shadow-lg transition">
                        <img src="${photo}" class="w-32 h-32 object-cover rounded-full mx-auto mb-4">
                        <h3 class="text-xl font-bold">${author.author_name}</h3>
                        <p class="text-gray-600 text-sm mt-2 line-clamp-3">${bio}</p>
                        <span class="text-blue-600 text-xs font-semibold mt-2 inline-block">বিস্তারিত দেখুন</span>
                    </div>
                `;
            });

            container.innerHTML = html;

            document.querySelectorAll(".author-card").forEach((card) => {
                card.addEventListener("click", () => {
                    const author = data[card.dataset.index];
                    const photo =
                        author.image_url ||
                        "https://via.placeholder.com/150x150?text=No+Photo";
                    const bio = author.bio || "No biography available.";
                    openDetailModal(author.author_name, photo, bio);
                });
            });
        } else if (type === "publishers") {
            data.forEach((pub, index) => {
                const logo =
                    pub.logo_url || "https://via.placeholder.com/150x150?text=No+Logo";
                const desc = pub.description || "No description available.";

                html += `
                    <div data-index="${index}" class="publisher-card cursor-pointer border rounded-lg p-5 shadow bg-white text-center hover:shadow-lg transition">
                        <img src="${logo}" class="w-32 h-32 object-cover rounded-full mx-auto mb-4">
                        <h3 class="text-xl font-bold">${pub.publisher_name}</h3>
                        <p class="text-gray-600 text-sm mt-2 line-clamp-3">${desc}</p>
                        <span class="text-blue-600 text-xs font-semibold mt-2 inline-block">বিস্তারিত দেখুন</span>
                    </div>
                `;
            });

            container.innerHTML = html;

            document.querySelectorAll(".publisher-card").forEach((card) => {
                card.addEventListener("click", () => {
                    const pub = data[card.dataset.index];
                    const logo =
                        pub.logo_url || "https://via.placeholder.com/150x150?text=No+Logo";
                    const desc = pub.description || "No description available.";
                    openDetailModal(pub.publisher_name, logo, desc);
                });
            });
        } else {
            // Categories
            data.forEach((item) => {
                let itemName = item.category_name || item.name;

                html += `
                    <div class="bg-white p-4 rounded shadow text-center flex items-center justify-center min-h-[100px]">
                        <h3 class="font-bold text-lg text-gray-800">${itemName}</h3>
                    </div>
                `;
            });

            container.innerHTML = html;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
