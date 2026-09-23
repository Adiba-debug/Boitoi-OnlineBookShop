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

            // ===============================
            // AUTHOR LINKS
            // ===============================

            const authorLinks = book.author_ids?.length
                ? book.author_ids.map((authorId, index) => `
                    <button
                        class="authorLink text-blue-600 hover:underline"
                        data-id="${authorId}"
                    >
                        ${book.author_names[index]}
                    </button>
                `).join(", ")
                : "N/A";


            // ===============================
            // CATEGORY LINKS
            // ===============================

            const categoryLinks = book.category_ids?.length
                ? book.category_ids.map((categoryId, index) => `
                    <button
                        class="categoryLink text-blue-600 hover:underline"
                        data-id="${categoryId}"
                    >
                        ${book.category_names[index]}
                    </button>
                `).join(", ")
                : "N/A";


            // ===============================
            // PUBLISHER LINK
            // ===============================

            const publisherLink = book.publisher_id
                ? `
                    <button
                        class="publisherLink text-blue-600 hover:underline"
                        data-id="${book.publisher_id}"
                    >
                        ${book.publisher_name || "N/A"}
                    </button>
                `
                : "N/A";


            row.innerHTML = `

                <!-- ID -->
                <td class="p-3">
                    ${book.book_id}
                </td>


                <!-- TITLE -->
                <td class="p-3 font-semibold">

                    <button
                        class="bookTitleLink text-blue-600 hover:underline text-left"
                        data-id="${book.book_id}"
                    >
                        ${book.title}
                    </button>

                </td>


                <!-- PRICE -->
                <td class="p-3">
                    ৳${book.price}
                </td>


                <!-- STOCK -->
                <td class="p-3">
                    ${book.stock}
                </td>

                <td class="p-3">
                    ${book.total_sold || 0}
                </td>


                <!-- IMAGE -->
                <td class="p-3">

                    ${book.image_url
                    ? `
                                <img
                                    src="${book.image_url}"
                                    alt="${book.title}"
                                    class="w-16 h-20 object-cover rounded"
                                >
                              `
                    : "No image"
                }

                </td>


                <!-- AUTHOR -->
                <td class="p-3">
                    ${authorLinks}
                </td>


                <!-- PUBLISHER -->
                <td class="p-3">
                    ${publisherLink}
                </td>


                <!-- CATEGORY -->
                <td class="p-3">
                    ${categoryLinks}
                </td>


                <!-- ACTIONS -->
                <td class="p-3">

                    ${isSuperAdmin

                    ? `<span class="text-gray-500">
                                View only
                               </span>`

                    : `

                                <button
                                    class="editBookBtn bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                                    data-id="${book.book_id}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="deleteBookBtn bg-red-600 text-white px-3 py-1 rounded"
                                    data-id="${book.book_id}"
                                >
                                    Delete
                                </button>

                              `
                }

                </td>

            `;

            tableBody.appendChild(row);


            // ===============================
            // BOOK TITLE CLICK
            // ===============================

            row.querySelector(".bookTitleLink")
                .addEventListener("click", () => {

                    window.location.href =
                        `book-details.html?id=${book.book_id}`;

                });


            // ===============================
            // AUTHOR CLICK
            // ===============================

            row.querySelectorAll(".authorLink")
                .forEach((button) => {

                    button.addEventListener("click", () => {

                        const authorId = button.dataset.id;

                        window.location.href =
                            `catalog.html?type=author&id=${authorId}`;

                    });

                });


            // ===============================
            // PUBLISHER CLICK
            // ===============================

            const publisherButton =
                row.querySelector(".publisherLink");

            if (publisherButton) {

                publisherButton.addEventListener("click", () => {

                    const publisherId =
                        publisherButton.dataset.id;

                    window.location.href =
                        `catalog.html?type=publisher&id=${publisherId}`;

                });

            }


            // ===============================
            // CATEGORY CLICK
            // ===============================

            row.querySelectorAll(".categoryLink")
                .forEach((button) => {

                    button.addEventListener("click", () => {

                        const categoryId = button.dataset.id;

                        window.location.href =
                            `catalog.html?type=category&id=${categoryId}`;

                    });

                });


            // ===============================
            // ADMIN EDIT / DELETE
            // ===============================

            if (!isSuperAdmin) {

                row.querySelector(".editBookBtn")
                    .addEventListener("click", () => {

                        editBook(book.book_id);

                    });


                row.querySelector(".deleteBookBtn")
                    .addEventListener("click", () => {

                        deleteBook(book.book_id);

                    });

            }

        });

    }
    catch (error) {

        console.error(error);

        alert("Cannot load books");

    }

}

async function loadPublisherOptions() {

    try {

        const response = await fetch(`${API_BASE}/publishers`);

        if (!response.ok) {
            throw new Error("Failed to load publishers");
        }

        const publishers = await response.json();

        const select = document.getElementById("editBookPublisher");
        const searchInput = document.getElementById("editBookPublisherSearch");

        select.innerHTML = `
            <option value="">Select Publisher</option>
        `;

        publishers.forEach((publisher) => {

            const option = document.createElement("option");

            option.value = publisher.publisher_id;
            option.textContent = publisher.publisher_name;

            select.appendChild(option);

        });

        searchInput.value = "";

        searchInput.oninput = () => {

            const searchText = searchInput.value.toLowerCase();

            const currentValue = select.value;

            Array.from(select.options).forEach((option, index) => {

                if (index === 0) {
                    option.hidden = false;
                    return;
                }

                const publisherName = option.textContent.toLowerCase();

                option.hidden = !publisherName.includes(searchText);

            });

            if (
                currentValue &&
                select.querySelector(`option[value="${currentValue}"]`) &&
                !select.querySelector(`option[value="${currentValue}"]`).hidden
            ) {
                select.value = currentValue;
            }

        };

    }
    catch (error) {

        console.error(error);

        alert("Cannot load publishers");

    }

}

async function loadAuthorOptions() {

    try {

        const response = await fetch(`${API_BASE}/authors`);

        if (!response.ok) {
            throw new Error("Failed to load authors");
        }

        const authors = await response.json();

        const container = document.getElementById("editBookAuthors");
        const searchInput = document.getElementById("editBookAuthorSearch");

        container.innerHTML = "";

        authors.forEach((author) => {

            const label = document.createElement("label");

            label.className = "flex items-center gap-2 mb-2";

            label.innerHTML = `
                <input
                    type="checkbox"
                    class="editBookAuthor"
                    value="${author.author_id}"
                >

                <span>${author.author_name}</span>
            `;

            container.appendChild(label);

        });

        searchInput.value = "";

        searchInput.oninput = () => {

            const searchText = searchInput.value.toLowerCase();

            const authorLabels = container.querySelectorAll("label");

            authorLabels.forEach((label) => {

                const authorName = label
                    .querySelector("span")
                    .textContent
                    .toLowerCase();

                if (authorName.includes(searchText)) {
                    label.classList.remove("hidden");
                } else {
                    label.classList.add("hidden");
                }

            });

        };

    }
    catch (error) {

        console.error(error);

        alert("Cannot load authors");

    }

}

async function loadCategoryOptions() {

    try {

        const response = await fetch(`${API_BASE}/categories`);

        if (!response.ok) {
            throw new Error("Failed to load categories");
        }

        const categories = await response.json();

        const container = document.getElementById("editBookCategories");
        const searchInput = document.getElementById("editBookCategorySearch");

        container.innerHTML = "";

        categories.forEach((category) => {

            const label = document.createElement("label");

            label.className = "flex items-center gap-2 mb-2";

            label.innerHTML = `
                <input
                    type="checkbox"
                    class="editBookCategory"
                    value="${category.category_id}"
                >

                <span>${category.category_name}</span>
            `;

            container.appendChild(label);

        });

        searchInput.value = "";

        searchInput.oninput = () => {

            const searchText = searchInput.value.toLowerCase();

            const categoryLabels = container.querySelectorAll("label");

            categoryLabels.forEach((label) => {

                const categoryName = label
                    .querySelector("span")
                    .textContent
                    .toLowerCase();

                if (categoryName.includes(searchText)) {
                    label.classList.remove("hidden");
                } else {
                    label.classList.add("hidden");
                }

            });

        };

    }
    catch (error) {

        console.error(error);

        alert("Cannot load categories");

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
            class="editAuthorBtn bg-yellow-500 text-white px-3 py-1 rounded mr-2"
            data-id="${author.author_id}"
        >
            Edit
        </button>

        <button
            class="deleteAuthorBtn bg-red-600 text-white px-3 py-1 rounded"
            data-id="${author.author_id}"
        >
            Delete
        </button>
    `
                }
</td>
        `;

            tableBody.appendChild(row);
            if (!isSuperAdmin) {

                row.querySelector(".editAuthorBtn").addEventListener("click", () => {
                    editAuthor(author.author_id);
                });

                row.querySelector(".deleteAuthorBtn").addEventListener("click", () => {
                    deleteAuthor(author.author_id);
                });

            }
        });
    } catch (error) {
        console.error(error);

        alert("Cannot load authors");
    }
}

let editingAuthorId = null;

async function editAuthor(authorId) {

    try {

        const response = await fetch(
            `${API_BASE}/authors/${authorId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load author");
        }

        const author = await response.json();

        editingAuthorId = authorId;

        document.getElementById("editAuthorName").value =
            author.author_name;

        document.getElementById("editAuthorBio").value =
            author.bio || "";

        document.getElementById("editAuthorImage").value =
            author.image_url || "";

        document.getElementById("editAuthorModal")
            .classList.remove("hidden");

    }
    catch (error) {

        console.error(error);

        alert("Cannot load author details");

    }

}
// ===============================
// CANCEL EDIT AUTHOR
// ===============================

document.getElementById("cancelEditAuthorBtn").addEventListener("click", () => {

    document.getElementById("editAuthorModal").classList.add("hidden");

});

// ===============================
// SAVE EDITED AUTHOR
// ===============================

document.getElementById("editAuthorForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const updatedAuthor = {
            author_name: document.getElementById("editAuthorName").value,
            bio: document.getElementById("editAuthorBio").value,
            image_url: document.getElementById("editAuthorImage").value
        };

        const response = await fetch(
            `${API_BASE}/authors/${editingAuthorId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedAuthor)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to update author");
            return;
        }

        alert("Author updated successfully");

        document.getElementById("editAuthorModal").classList.add("hidden");

        loadAuthors();

    }
    catch (error) {

        console.error(error);

        alert("Cannot update author");

    }

});

async function deleteAuthor(authorId) {

    const confirmed = confirm(
        "Are you sure you want to delete this author?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/authors/${authorId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {

            const data = await response.json();

            alert(data.message || "Failed to delete author");

            return;
        }

        alert("Author deleted successfully");

        loadAuthors();

    }
    catch (error) {

        console.error(error);

        alert("Cannot delete author");

    }

}
// ===============================
// ADD AUTHOR MODAL
// ===============================

document.getElementById("addAuthorBtn").addEventListener("click", () => {

    document.getElementById("addAuthorModal").classList.remove("hidden");

});

// ===============================
// CANCEL ADD AUTHOR
// ===============================

document.getElementById("cancelAddAuthorBtn").addEventListener("click", () => {

    document.getElementById("addAuthorModal").classList.add("hidden");

});
// ===============================
// SAVE NEW AUTHOR
// ===============================

document.getElementById("addAuthorForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const newAuthor = {
            author_name: document.getElementById("addAuthorName").value,
            bio: document.getElementById("addAuthorBio").value,
            image_url: document.getElementById("addAuthorImage").value
        };

        const response = await fetch(
            `${API_BASE}/authors`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(newAuthor)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to add author");
            return;
        }

        alert("Author added successfully");

        document.getElementById("addAuthorModal").classList.add("hidden");

        document.getElementById("addAuthorForm").reset();

        loadAuthors();

    }
    catch (error) {

        console.error(error);

        alert("Cannot add author");

    }

});

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
    class="editPublisherBtn bg-yellow-500 text-white px-3 py-1 rounded mr-2"
    data-id="${publisher.publisher_id}"
>
    Edit
</button>

                <button
    class="deletePublisherBtn bg-red-600 text-white px-3 py-1 rounded"
    data-id="${publisher.publisher_id}"
>
    Delete
</button>
            `
                }
</td>
        `;

            tableBody.appendChild(row);
            if (!isSuperAdmin) {

                row.querySelector(".editPublisherBtn").addEventListener("click", () => {
                    editPublisher(publisher.publisher_id);
                });

                row.querySelector(".deletePublisherBtn").addEventListener("click", () => {
                    deletePublisher(publisher.publisher_id);
                });

            }
        });
    } catch (error) {
        console.error(error);

        alert("Cannot load publishers");
    }
}


let editingPublisherId = null;

async function editPublisher(publisherId) {

    try {

        const response = await fetch(
            `${API_BASE}/publishers/${publisherId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load publisher");
        }

        const publisher = await response.json();

        editingPublisherId = publisherId;

        document.getElementById("editPublisherName").value =
            publisher.publisher_name;

        document.getElementById("editPublisherDescription").value =
            publisher.description || "";

        document.getElementById("editPublisherLogo").value =
            publisher.logo_url || "";

        document.getElementById("editPublisherModal")
            .classList.remove("hidden");

    }
    catch (error) {

        console.error(error);

        alert("Cannot load publisher details");

    }

}

async function deletePublisher(publisherId) {

    const confirmed = confirm(
        "Are you sure you want to delete this publisher?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/publishers/${publisherId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {

            const data = await response.json();

            alert(data.message || "Failed to delete publisher");

            return;
        }

        alert("Publisher deleted successfully");

        loadPublishers();

    }
    catch (error) {

        console.error(error);

        alert("Cannot delete publisher");

    }

}

// ===============================
// CANCEL EDIT PUBLISHER
// ===============================

document.getElementById("cancelEditPublisherBtn").addEventListener("click", () => {

    document.getElementById("editPublisherModal").classList.add("hidden");

});

// ===============================
// SAVE EDITED PUBLISHER
// ===============================

document.getElementById("editPublisherForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const updatedPublisher = {
            publisher_name: document.getElementById("editPublisherName").value,
            description: document.getElementById("editPublisherDescription").value,
            logo_url: document.getElementById("editPublisherLogo").value
        };

        const response = await fetch(
            `${API_BASE}/publishers/${editingPublisherId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedPublisher)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to update publisher");
            return;
        }

        alert("Publisher updated successfully");

        document.getElementById("editPublisherModal").classList.add("hidden");

        loadPublishers();

    }
    catch (error) {

        console.error(error);

        alert("Cannot update publisher");

    }

});

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
    class="editCategoryBtn bg-yellow-500 text-white px-3 py-1 rounded mr-2"
    data-id="${category.category_id}"
>
    Edit
</button>

                <button
    class="deleteCategoryBtn bg-red-600 text-white px-3 py-1 rounded"
    data-id="${category.category_id}"
>
    Delete
</button>
            `
                }
</td>
        `;

            tableBody.appendChild(row);

            if (!isSuperAdmin) {

                row.querySelector(".editCategoryBtn").addEventListener("click", () => {
                    editCategory(category.category_id);
                });

                row.querySelector(".deleteCategoryBtn").addEventListener("click", () => {
                    deleteCategory(category.category_id);
                });

            }
        });
    } catch (error) {
        console.error(error);

        alert("Cannot load categories");
    }
}

let editingCategoryId = null;

async function editCategory(categoryId) {

    try {

        const response = await fetch(
            `${API_BASE}/categories/${categoryId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load category");
        }

        const category = await response.json();

        editingCategoryId = categoryId;

        document.getElementById("editCategoryName").value =
            category.category_name;

        document.getElementById("editCategoryModal")
            .classList.remove("hidden");

    }
    catch (error) {

        console.error(error);

        alert("Cannot load category details");

    }

}
document.getElementById("cancelEditCategoryBtn").addEventListener("click", () => {

    document.getElementById("editCategoryModal").classList.add("hidden");

});
document.getElementById("editCategoryForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const updatedCategory = {
            category_name: document.getElementById("editCategoryName").value
        };

        const response = await fetch(
            `${API_BASE}/categories/${editingCategoryId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedCategory)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to update category");
            return;
        }

        alert("Category updated successfully");

        document.getElementById("editCategoryModal").classList.add("hidden");

        loadCategories();

    }
    catch (error) {

        console.error(error);

        alert("Cannot update category");

    }

});

async function deleteCategory(categoryId) {

    const confirmed = confirm(
        "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/categories/${categoryId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {

            const data = await response.json();

            alert(data.message || "Failed to delete category");

            return;
        }

        alert("Category deleted successfully");

        loadCategories();

    }
    catch (error) {

        console.error(error);

        alert("Cannot delete category");

    }

}

document.getElementById("addCategoryBtn").addEventListener("click", () => {

    document.getElementById("addCategoryModal").classList.remove("hidden");

});
document.getElementById("cancelAddCategoryBtn").addEventListener("click", () => {

    document.getElementById("addCategoryModal").classList.add("hidden");

});
document.getElementById("addCategoryForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const newCategory = {
            category_name: document.getElementById("addCategoryName").value
        };

        const response = await fetch(
            `${API_BASE}/categories`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(newCategory)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to add category");
            return;
        }

        alert("Category added successfully");

        document.getElementById("addCategoryModal").classList.add("hidden");

        document.getElementById("addCategoryForm").reset();

        loadCategories();

    }
    catch (error) {

        console.error(error);

        alert("Cannot add category");

    }

});

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

const tabButtons = {
    books: document.getElementById("booksTab"),
    authors: document.getElementById("authorsTab"),
    publishers: document.getElementById("publishersTab"),
    categories: document.getElementById("categoriesTab"),
};

function setActiveTab(activeTab) {

    Object.values(tabButtons).forEach((button) => {
        button.classList.remove("bg-blue-600", "text-white");
        button.classList.add("bg-gray-300", "text-gray-800");
    });

    tabButtons[activeTab].classList.remove(
        "bg-gray-300",
        "text-gray-800"
    );

    tabButtons[activeTab].classList.add(
        "bg-blue-600",
        "text-white"
    );
}

document.getElementById("booksTab").addEventListener("click", () => {
    showSection("books");
    setActiveTab("books");
    loadBooks();
});

document.getElementById("authorsTab").addEventListener("click", () => {
    showSection("authors");
    setActiveTab("authors");
    loadAuthors();
});

document.getElementById("publishersTab").addEventListener("click", () => {
    showSection("publishers");
    setActiveTab("publishers");
    loadPublishers();
});

document.getElementById("categoriesTab").addEventListener("click", () => {
    showSection("categories");
    setActiveTab("categories");
    loadCategories();
});

// Initial tab
loadBooks();
setActiveTab("books");

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
// DELETE BOOK
// ===============================

async function deleteBook(bookId) {
    const confirmed = confirm("Are you sure you want to delete this book?");

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/books/${bookId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to delete book");
            return;
        }

        alert("Book deleted successfully");

        loadBooks();
    } catch (error) {
        console.error(error);

        alert("Cannot delete book");
    }
}

// ===============================
// EDIT BOOK
// ===============================

let editingBookId = null;

async function editBook(bookId) {

    try {

        const response = await fetch(`${API_BASE}/books/${bookId}`);

        if (!response.ok) {
            throw new Error("Failed to load book");
        }

        const book = await response.json();

        editingBookId = bookId;

        document.getElementById("editBookTitle").value = book.title;
        document.getElementById("editBookPrice").value = book.price;
        document.getElementById("editBookStock").value = book.stock;
        document.getElementById("editBookDescription").value =
            book.description || "";

        await loadPublisherOptions();

        document.getElementById("editBookPublisher").value = book.publisher_id;

        await loadAuthorOptions();

        book.author_ids.forEach((authorId) => {

            const checkbox = document.querySelector(
                `.editBookAuthor[value="${authorId}"]`
            );

            if (checkbox) {
                checkbox.checked = true;
            }

        });
        await loadCategoryOptions();

        book.category_ids.forEach((categoryId) => {

            const checkbox = document.querySelector(
                `.editBookCategory[value="${categoryId}"]`
            );

            if (checkbox) {
                checkbox.checked = true;
            }

        });
        document.getElementById("editBookImage").value = book.image_url || "";


        document.getElementById("editBookModal").classList.remove("hidden");

    } catch (error) {

        console.error(error);

        alert("Cannot load book details");

    }
}
// ===============================
// CANCEL EDIT BOOK
// ===============================

document.getElementById("cancelEditBookBtn").addEventListener("click", () => {

    document.getElementById("editBookModal").classList.add("hidden");

});

// ===============================
// SAVE EDITED BOOK
// ===============================

document.getElementById("editBookForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const selectedAuthorIds = Array.from(
            document.querySelectorAll(".editBookAuthor:checked")
        ).map((checkbox) => Number(checkbox.value));
        const selectedCategoryIds = Array.from(
            document.querySelectorAll(".editBookCategory:checked")
        ).map((checkbox) => Number(checkbox.value));

        const updatedBook = {
            title: document.getElementById("editBookTitle").value,
            price: Number(document.getElementById("editBookPrice").value),
            stock: Number(document.getElementById("editBookStock").value),
            description: document.getElementById("editBookDescription").value,
            publisher_id: Number(document.getElementById("editBookPublisher").value),
            image_url: document.getElementById("editBookImage").value,
            author_ids: selectedAuthorIds,
            category_ids: selectedCategoryIds
        };

        const response = await fetch(
            `${API_BASE}/books/${editingBookId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedBook)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to update book");
            return;
        }

        alert("Book updated successfully");

        document.getElementById("editBookModal").classList.add("hidden");

        loadBooks();

    } catch (error) {

        console.error(error);

        alert("Cannot update book");

    }

});

// ===============================
// LOAD ADD BOOK PUBLISHERS
// ===============================

async function loadAddBookPublisherOptions() {

    try {

        const response = await fetch(`${API_BASE}/publishers`);

        if (!response.ok) {
            throw new Error("Failed to load publishers");
        }

        const publishers = await response.json();

        const select = document.getElementById("addBookPublisher");
        const searchInput = document.getElementById("addBookPublisherSearch");

        select.innerHTML = `
            <option value="">Select Publisher</option>
        `;

        publishers.forEach((publisher) => {

            const option = document.createElement("option");

            option.value = publisher.publisher_id;
            option.textContent = publisher.publisher_name;

            select.appendChild(option);

        });

        searchInput.value = "";

        searchInput.oninput = () => {

            const searchText = searchInput.value.toLowerCase();

            Array.from(select.options).forEach((option, index) => {

                if (index === 0) {
                    option.hidden = false;
                    return;
                }

                option.hidden = !option.textContent
                    .toLowerCase()
                    .includes(searchText);

            });

        };

    }
    catch (error) {

        console.error(error);

        alert("Cannot load publishers");

    }

}


// ===============================
// LOAD ADD BOOK AUTHORS
// ===============================

async function loadAddBookAuthorOptions() {

    try {

        const response = await fetch(`${API_BASE}/authors`);

        if (!response.ok) {
            throw new Error("Failed to load authors");
        }

        const authors = await response.json();

        const container = document.getElementById("addBookAuthors");
        const searchInput = document.getElementById("addBookAuthorSearch");

        container.innerHTML = "";

        authors.forEach((author) => {

            const label = document.createElement("label");

            label.className = "flex items-center gap-2 mb-2";

            label.innerHTML = `
                <input
                    type="checkbox"
                    class="addBookAuthor"
                    value="${author.author_id}"
                >

                <span>${author.author_name}</span>
            `;

            container.appendChild(label);

        });

        searchInput.value = "";

        searchInput.oninput = () => {

            const searchText = searchInput.value.toLowerCase();

            container.querySelectorAll("label").forEach((label) => {

                const authorName = label
                    .querySelector("span")
                    .textContent
                    .toLowerCase();

                if (authorName.includes(searchText)) {
                    label.classList.remove("hidden");
                }
                else {
                    label.classList.add("hidden");
                }

            });

        };

    }
    catch (error) {

        console.error(error);

        alert("Cannot load authors");

    }

}


// ===============================
// LOAD ADD BOOK CATEGORIES
// ===============================

async function loadAddBookCategoryOptions() {

    try {

        const response = await fetch(`${API_BASE}/categories`);

        if (!response.ok) {
            throw new Error("Failed to load categories");
        }

        const categories = await response.json();

        const container = document.getElementById("addBookCategories");
        const searchInput = document.getElementById("addBookCategorySearch");

        container.innerHTML = "";

        categories.forEach((category) => {

            const label = document.createElement("label");

            label.className = "flex items-center gap-2 mb-2";

            label.innerHTML = `
                <input
                    type="checkbox"
                    class="addBookCategory"
                    value="${category.category_id}"
                >

                <span>${category.category_name}</span>
            `;

            container.appendChild(label);

        });

        searchInput.value = "";

        searchInput.oninput = () => {

            const searchText = searchInput.value.toLowerCase();

            container.querySelectorAll("label").forEach((label) => {

                const categoryName = label
                    .querySelector("span")
                    .textContent
                    .toLowerCase();

                if (categoryName.includes(searchText)) {
                    label.classList.remove("hidden");
                }
                else {
                    label.classList.add("hidden");
                }

            });

        };

    }
    catch (error) {

        console.error(error);

        alert("Cannot load categories");

    }

}

// ===============================
// ADD BOOK MODAL
// ===============================

document.getElementById("addBookBtn").addEventListener("click", async () => {

    await loadAddBookPublisherOptions();
    await loadAddBookAuthorOptions();
    await loadAddBookCategoryOptions();

    document.getElementById("addBookModal").classList.remove("hidden");

});
document.getElementById("cancelAddBookBtn").addEventListener("click", () => {

    document.getElementById("addBookModal").classList.add("hidden");

});

// ===============================
// SAVE NEW BOOK
// ===============================

document.getElementById("addBookForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const selectedAuthorIds = Array.from(
            document.querySelectorAll(".addBookAuthor:checked")
        ).map((checkbox) => Number(checkbox.value));

        const selectedCategoryIds = Array.from(
            document.querySelectorAll(".addBookCategory:checked")
        ).map((checkbox) => Number(checkbox.value));

        const newBook = {
            title: document.getElementById("addBookTitle").value,
            price: Number(document.getElementById("addBookPrice").value),
            stock: Number(document.getElementById("addBookStock").value),
            description: document.getElementById("addBookDescription").value,
            publisher_id: Number(document.getElementById("addBookPublisher").value),
            image_url: document.getElementById("addBookImage").value,
            author_ids: selectedAuthorIds,
            category_ids: selectedCategoryIds
        };

        const response = await fetch(`${API_BASE}/books`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(newBook)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to add book");
            return;
        }

        alert("Book added successfully");

        document.getElementById("addBookModal").classList.add("hidden");

        document.getElementById("addBookForm").reset();

        loadBooks();

    } catch (error) {

        console.error(error);

        alert("Cannot add book");

    }

});

// ===============================
// ADD PUBLISHER MODAL
// ===============================

document.getElementById("addPublisherBtn").addEventListener("click", () => {

    document.getElementById("addPublisherModal").classList.remove("hidden");

});

// ===============================
// CANCEL ADD PUBLISHER
// ===============================

document.getElementById("cancelAddPublisherBtn").addEventListener("click", () => {

    document.getElementById("addPublisherModal").classList.add("hidden");

});
// ===============================
// SAVE NEW PUBLISHER
// ===============================

document.getElementById("addPublisherForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        const newPublisher = {
            publisher_name: document.getElementById("addPublisherName").value,
            description: document.getElementById("addPublisherDescription").value,
            logo_url: document.getElementById("addPublisherLogo").value
        };

        const response = await fetch(
            `${API_BASE}/publishers`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(newPublisher)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to add publisher");
            return;
        }

        alert("Publisher added successfully");

        document.getElementById("addPublisherModal").classList.add("hidden");

        document.getElementById("addPublisherForm").reset();

        loadPublishers();

    }
    catch (error) {

        console.error(error);

        alert("Cannot add publisher");

    }

});