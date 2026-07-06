const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: {
    rejectUnauthorized: true,
  },
});

db.connect((err) => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("TiDB Connected");
  }
});

module.exports = db;