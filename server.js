const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const User = require("./models/User"); 

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Backend Quorrect connecté ");
});

// Last seen
setInterval(async () => {
  const timeout = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();

  await User.updateMany(
    { isOnline: true, lastSeen: { $lt: new Date(now - timeout) } },
    { isOnline: false }
  );
}, 60 * 1000); // vérifie chaque minute

// Auth routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);   

// Users routes
const usersRoutes = require("./routes/users");
app.use("/api/users", usersRoutes);

// Classes routes
const classesRoutes = require("./routes/classes");
app.use("/api/classes", classesRoutes);

// Matieres routes
const matieresRoutes = require("./routes/matieres");
app.use("/api/matieres", matieresRoutes);

// Examen routes
const examsRoutes = require("./routes/exams");
app.use("/api/exams", examsRoutes);

// Notes routes
const notesRoutes = require("./routes/notes");
app.use("/api/notes", notesRoutes);

//Student routes
const studentsRoutes = require("./routes/students");
app.use("/api/students", studentsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
