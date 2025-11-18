const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
require("dotenv").config();

// POST /api/auth/register
// ➡️ Inscription
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, userType, classe } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = new User({
      name,
      email,
      password: hashedPassword,
      userType, // "etudiant" ou "professeur"
      classe    // utile pour les étudiants
    });

    await user.save();

    // Générer le token avec userType et classe inclus
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userType: user.userType,
        classe: user.classe
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Inscription réussie",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        classe: user.classe
      }
    });
  } catch (err) {
    console.error("Erreur inscription:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/auth/login
// ➡️ Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Générer le token avec userType inclus
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userType: user.userType,   // ✅ ajoute le type d’utilisateur
        classe: user.classe        // ✅ utile pour les étudiants
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        classe: user.classe
      }
    });
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isOnline: false });
    res.json({ message: "Déconnecté avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/auth/me - get current user from token
router.get("/me", async (req, res) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token =
    authHeader && authHeader.split(" ")[0] === "Bearer"
      ? authHeader.split(" ")[1]
      : null;
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
