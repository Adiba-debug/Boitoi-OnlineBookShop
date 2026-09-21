
// =========================
// Get Logged-in User
// =========================

function getLoggedInUser() {

    return JSON.parse(localStorage.getItem("user"));

}


// =========================
// Update Cart Count
// =========================

async function updateCartCount() {

    const user = getLoggedInUser();

    const cartCount = document.getElementById("cartCount");


    // User login না করলে count = 0
    if (!user) {

        if (cartCount) {
            cartCount.innerText = "0";
        }

        return;

    }


    try {

        const response = await fetch(
    "http://localhost:5000/api/cart",
    {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    }
);


        if (!response.ok) {

            throw new Error("Failed to load cart");

        }


        const cart = await response.json();


        // সব quantity যোগ করা
        const totalItems = cart.reduce(
            (sum, item) => sum + Number(item.quantity),
            0
        );


        if (cartCount) {

            cartCount.innerText = totalItems;

        }


    } catch (error) {

        console.log("Cart count error:", error);

    }

}


// =========================
// Add To Cart
// =========================

async function addToCart(book) {

    const user = getLoggedInUser();


    // Login না করলে Add করা যাবে না
    if (!user) {

        alert("Please login first!");

        window.location.href = "login.html";

        return;

    }


    try {

        const response = await fetch(
            "http://localhost:5000/api/cart/add",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },

                body: JSON.stringify({

                    user_id: user.user_id,

                    book_id: book.book_id

                })

            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(data.message || "Failed to add to cart");

            return;

        }


        // Database থেকে নতুন count আনবে
        await updateCartCount();


        alert(`${book.title} added to cart!`);


    } catch (error) {

        console.log("Add to cart error:", error);

        alert("Something went wrong!");

    }

}




// =========================
// Load Cart Count
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCartCount();

    }
);

