// File: scripts/hashPassword.js
const bcrypt = require('bcrypt');

const password = '1234';
const saltRounds = 10; // Adjust based on your auth logic

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Hashed password:', hash);
});