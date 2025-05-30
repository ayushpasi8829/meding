require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();

// CORS Configuration
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/reports", express.static(path.join(__dirname, "reports")));
// MongoDB Connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://tanishqworkk:QTDGb4FeghleAQeZ@cluster0.6yzgqyv.mongodb.net/mending?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes
const authRoute = require("./routes/auth");
app.use("/api/auth", authRoute);

//admin route
const doctor = require("./routes/admin/admin");
const game = require("./routes/admin/game");
app.use("/api/admin", doctor);
app.use("/api/game", game);

//Doctor route
const session = require("./routes/doctor/session");
app.use("/api/doctor", session);

//user route
const user = require("./routes/user/user");
const gameanswer = require("./routes/user/game");
const appointment = require("./routes/appointmentRoute");
app.use("/api/user", user);
app.use("/api/game", gameanswer);
app.use("/api/appointment", appointment);

//community initiative route
const communityInitiative = require("./routes/communityInitiative");
app.use("/api/community", communityInitiative);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
