async function loadBookDetails() {
  try {
    // URL থেকে book id নেওয়া
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("id");

    if (!bookId) {
      document.getElementById("bookDetails").innerHTML = `
                <p class="text-center text-red-500">
                    Book ID not found.
                </p>
            `;

      return;
    }

    // Backend API call
    const response = await fetch(`http://localhost:5000/api/books/${bookId}`);

    if (!response.ok) {
      throw new Error("Book not found");
    }

    const book = await response.json();

    const container = document.getElementById("bookDetails");

    container.innerHTML = `

            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">


                <!-- Book Image -->

                <div class="flex justify-center">

                    <img
                        src="${book.image_url}"
                        alt="${book.title}"
                        class="w-80 h-[450px] object-cover rounded-lg shadow"
                    >

                </div>



                <!-- Book Information -->

                <div>

                    <h1 class="text-4xl font-bold mb-6">
                        ${book.title}
                    </h1>


                    <p class="text-2xl font-bold text-blue-600 mb-4">
                        ${book.price} Tk
                    </p>


                    <div class="space-y-3 text-lg">

                        <p>
                            <strong>Writer:</strong>
                            ${book.authors || "Unknown"}
                        </p>


                        <p>
                            <strong>Publisher:</strong>
                            ${book.publisher || "Unknown"}
                        </p>


                        <p>
                            <strong>Category:</strong>
                            ${book.categories || "Unknown"}
                        </p>


                        <p>
                            <strong>Stock:</strong>
                            ${book.stock}
                        </p>

                    </div>


                    <hr class="my-6">


                    <h2 class="text-2xl font-bold mb-3">
                        Description
                    </h2>


                    <p id="descriptionText" class="text-gray-700 leading-7">
                        ${
                          book.description && book.description.length > 250
                            ? book.description.substring(0, 250) + "..."
                            : book.description || "No description available."
                        }
                    </p>
                <div class="flex flex-col items-start">

                    ${
                      book.description && book.description.length > 250
                        ? `
                                <button
                                    id="readMoreBtn"
                                    class="text-blue-600 font-semibold mt-1 hover:underline">
                                    Read More
                                </button>
                            `
                        : ""
                    }


                    <button
                        class="bg-blue-600 text-white px-4 py-3 rounded mt-4 hover:bg-blue-700">

                        Add to Cart 🛒

                    </button>
                    </div>

                </div>

            </div>

        `;
    const description = book.description || "";

    if (description.length > 250) {
      const descriptionText = document.getElementById("descriptionText");

      const readMoreBtn = document.getElementById("readMoreBtn");

      readMoreBtn.addEventListener("click", function () {
        if (readMoreBtn.innerText === "Read More") {
          descriptionText.innerText = description;

          readMoreBtn.innerText = "Read Less";
        } else {
          descriptionText.innerText = description.substring(0, 250) + "...";

          readMoreBtn.innerText = "Read More";
        }
      });
    }
  } catch (error) {
    console.error(error);

    document.getElementById("bookDetails").innerHTML = `

            <p class="text-center text-red-500 text-xl">
                Cannot load book details.
            </p>

        `;
  }
}

loadBookDetails();
