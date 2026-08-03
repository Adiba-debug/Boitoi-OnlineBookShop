document.getElementById("registerForm").addEventListener("submit", async function(e) {

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