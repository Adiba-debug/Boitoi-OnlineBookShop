const bcrypt = require("bcrypt");

async function hashPassword() {
    const hashedPassword = await bcrypt.hash("moumou", 10);
    console.log(hashedPassword);
}

hashPassword();