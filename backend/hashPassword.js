const bcrypt = require("bcrypt");

async function hashPassword() {
    const hashedPassword = await bcrypt.hash("1234", 10);
    console.log(hashedPassword);
}

hashPassword();