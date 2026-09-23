// =========================
// Utility: escape HTML to prevent XSS
// =========================

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================
// Render star display (read-only)
// =========================

function renderStars(rating) {
    const val = Number(rating) || 0;
    let html = "";
    for (let i = 1; i <= 5; i++) {
        if (val >= i) {
            html += '<span class="text-yellow-400">★</span>';
        } else if (val >= i - 0.5) {
            html += '<span class="text-yellow-400">½</span>';
        } else {
            html += '<span class="text-gray-300">★</span>';
        }
    }
    return html;
}


// =========================
// Render interactive star picker
// =========================

function renderStarPicker(selectedRating) {
    let html = '<div id="starPicker" class="flex gap-1 text-3xl mb-3 cursor-pointer">';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= selectedRating ? "text-yellow-400" : "text-gray-300";
        html += `<span class="star-pick ${filled} hover:text-yellow-400 transition" data-value="${i}">★</span>`;
    }
    html += "</div>";
    return html;
}


// =========================
// Load review summary (avg + count) — injects into #reviewSummary
// =========================

async function loadReviewSummary(bookId) {
    try {
        const res = await fetch(`http://localhost:5000/api/reviews/book/${bookId}/summary`);
        const data = await res.json();

        const el = document.getElementById("reviewSummary");
        if (!el) return;

        if (!data.review_count || data.review_count === 0) {
            el.innerHTML = `<p class="text-gray-500 text-sm">No reviews yet</p>`;
            return;
        }

        el.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="text-2xl font-bold text-yellow-500">${data.average_rating}</span>
                <span class="flex text-xl">${renderStars(data.average_rating)}</span>
            </div>
            <p class="text-gray-500 text-sm">${data.review_count} review${data.review_count !== 1 ? "s" : ""}</p>
        `;
    } catch (err) {
        console.error("Review summary error:", err);
    }
}


// =========================
// Load review list — injects into #reviewList
// =========================

async function loadReviewList(bookId) {
    try {
        const res = await fetch(`http://localhost:5000/api/reviews/book/${bookId}`);
        const reviews = await res.json();

        const el = document.getElementById("reviewList");
        if (!el) return;

        if (!reviews.length) {
            el.innerHTML = `<p class="text-gray-400 text-sm italic">No reviews yet. Be the first!</p>`;
            return;
        }

        el.innerHTML = reviews.map(r => `
            <div class="border-b pb-4 mb-4 last:border-0 last:mb-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="flex">${renderStars(r.rating)}</span>
                    <span class="font-semibold text-gray-800">${escapeHtml(r.customer_name)}</span>
                </div>
                <p class="text-gray-700 leading-relaxed">${escapeHtml(r.review_comment)}</p>
                <p class="text-gray-400 text-xs mt-1">
                    ${new Date(r.review_date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric"
                    })}
                </p>
            </div>
        `).join("");

    } catch (err) {
        console.error("Review list error:", err);
    }
}


// =========================
// Load review form area — injects into #reviewFormArea
// =========================

async function loadReviewForm(bookId) {
    const el = document.getElementById("reviewFormArea");
    if (!el) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!user || !token) {
        el.innerHTML = `
            <p class="text-gray-500 text-sm">
                <a href="login.html" class="text-blue-600 hover:underline">Login</a>
                to leave a review.
            </p>
        `;
        return;
    }

    try {
        const res = await fetch(
            `http://localhost:5000/api/reviews/eligibility/${bookId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (!data.eligible) {
            el.innerHTML = `
                <p class="text-gray-500 text-sm italic">
                    Purchase and receive this book to leave a review.
                </p>
            `;
            return;
        }

        if (data.hasReviewed) {
            el.innerHTML = `
                <p class="text-green-600 font-semibold text-sm">
                    ✓ You have already reviewed this book.
                </p>
            `;
            return;
        }

        // Show review form
        el.innerHTML = `
            <h3 class="text-lg font-bold mb-3">Rate this book</h3>
            ${renderStarPicker(0)}
            <input type="hidden" id="selectedRating" value="0">
            <p id="ratingError" class="text-red-500 text-xs mb-2 hidden">Please select a rating.</p>
            <textarea
                id="reviewText"
                rows="4"
                maxlength="2000"
                placeholder="Write your review here..."
                class="w-full border rounded p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-2"
            ></textarea>
            <p id="reviewTextError" class="text-red-500 text-xs mb-2 hidden">Please write a review.</p>
            <button
                id="submitReviewBtn"
                class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition text-sm font-semibold">
                Submit Review
            </button>
            <p id="reviewSubmitMsg" class="mt-2 text-sm hidden"></p>
        `;

        // Wire up star picker
        let currentRating = 0;
        const stars = el.querySelectorAll(".star-pick");

        stars.forEach(star => {
            star.addEventListener("mouseenter", () => {
                const v = Number(star.dataset.value);
                stars.forEach(s => {
                    s.classList.toggle("text-yellow-400", Number(s.dataset.value) <= v);
                    s.classList.toggle("text-gray-300", Number(s.dataset.value) > v);
                });
            });

            star.addEventListener("mouseleave", () => {
                stars.forEach(s => {
                    s.classList.toggle("text-yellow-400", Number(s.dataset.value) <= currentRating);
                    s.classList.toggle("text-gray-300", Number(s.dataset.value) > currentRating);
                });
            });

            star.addEventListener("click", () => {
                currentRating = Number(star.dataset.value);
                document.getElementById("selectedRating").value = currentRating;
                document.getElementById("ratingError").classList.add("hidden");
            });
        });

        // Submit handler
        document.getElementById("submitReviewBtn").addEventListener("click", async () => {
            const rating = parseInt(document.getElementById("selectedRating").value, 10);
            const comment = document.getElementById("reviewText").value.trim();

            let valid = true;

            if (!rating || rating < 1 || rating > 5) {
                document.getElementById("ratingError").classList.remove("hidden");
                valid = false;
            }
            if (!comment) {
                document.getElementById("reviewTextError").classList.remove("hidden");
                valid = false;
            }

            if (!valid) return;

            const submitBtn = document.getElementById("submitReviewBtn");
            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting...";

            try {
                const postRes = await fetch("http://localhost:5000/api/reviews", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        book_id: bookId,
                        rating,
                        review_comment: comment
                    })
                });

                const postData = await postRes.json();

                if (!postRes.ok) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Review";
                    const msg = document.getElementById("reviewSubmitMsg");
                    msg.textContent = postData.message || "Submission failed.";
                    msg.className = "mt-2 text-sm text-red-500";
                    msg.classList.remove("hidden");
                    return;
                }

                // Success — refresh all three sections
                el.innerHTML = `
                    <p class="text-green-600 font-semibold">✓ Review submitted successfully!</p>
                `;
                await loadReviewSummary(bookId);
                await loadReviewList(bookId);

            } catch (err) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Review";
                console.error(err);
            }
        });

    } catch (err) {
        console.error("Review form error:", err);
        el.innerHTML = `<p class="text-red-500 text-sm">Failed to load review form.</p>`;
    }
}


// =========================
// Main entry: load all review sections for a book page
// =========================

async function loadBookReviews(bookId) {
    await Promise.all([
        loadReviewSummary(bookId),
        loadReviewList(bookId),
        loadReviewForm(bookId)
    ]);
}
