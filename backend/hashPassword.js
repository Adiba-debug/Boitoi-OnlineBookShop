const bcrypt = require("bcrypt");

async function hashPassword() {
    const hashedPassword = await bcrypt.hash("fairooz123", 10);
    console.log(hashedPassword);
}

hashPassword();