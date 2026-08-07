document.getElementById("registerForm")?.addEventListener("submit", async function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;


    try {

        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });


        const data = await response.json();

        alert(data.message);

    } catch (error) {

        console.log(error);
        alert("Something went wrong!");

    }

});



document.getElementById("loginForm")?.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;


    try {

        const response = await fetch("http://localhost:5000/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

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
    if(logoutBtn){
        logoutBtn.classList.remove("hidden");
    }
    
}
else {
    if(userName){
        userName.innerHTML = "";
    }

    if(loginLink){
        loginLink.style.display = "inline";
    }

    if(registerLink){
        registerLink.style.display = "inline";
    }

    if (logoutBtn) {
                logoutBtn.classList.add("hidden");

    }
}


if(logoutBtn){

    logoutBtn.addEventListener("click", function(){

        localStorage.removeItem("user");

        alert("Logged out successfully!");

        window.location.href = "index.html";

    });

}

async function loadBooks(){

    try{

        const response = await fetch("http://localhost:5000/api/books");

        const books = await response.json();


        const container = document.getElementById("bookContainer");


        books.forEach(book => {


            const card = document.createElement("div");


            card.className = 
            "border rounded-lg p-5 shadow bg-white";


            card.innerHTML = `

                <img 
                src="${book.image_url}"
                class="w-60 h-100 object-cover mb-4">


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
                class="bg-blue-600 text-white px-4 py-2 rounded mt-4">
                    Add to Cart
                </button>

            `;


            container.appendChild(card);


        });


    }

    catch(error){

        console.log(error);

    }

}


loadBooks();