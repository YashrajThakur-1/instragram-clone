const mongoose = require("mongoose");
const uri = process.env.uri;
mongoose.connect(uri);
const db = mongoose.connection;
db.on("connected", () => {
  console.log("Database Connected Succesfully");
});
db.on("error", (err) => {
  console.log("Error", err);
});
db.on("disconnected", () => {
  console.log("Database disConnected Succesfully");
});
