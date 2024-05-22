require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./database/db");
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(
  cors({
    origin: "*", // Consider replacing "*" with specific domains
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
  })
);
const path = require("path");
app.use(express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const userRoutes = require("./routes/UserRoutes");
const postRoutes = require("./routes/PostRoutes");
const commentRoutes = require("./routes/CommentRoutes");
const likeRoutes = require("./routes/LikeRoutes");
const port = 3001;
app.use("/api", userRoutes);
app.use("/posts", postRoutes);
app.use("/api", commentRoutes);
app.use("/api", likeRoutes);
app.listen(port, () => {
  console.log(`Server Running On Port ${port}`);
});
