const bcrypt = require('bcrypt');

async function generateHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.log('Usage: node generate-password-hash.js <password>');
    console.log('Example: node generate-password-hash.js mypassword123');
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('\nSQL Example:');
    console.log(`INSERT INTO Empleado (nombre, numDias, hashed) VALUES ('username', 10, '${hash}');`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();