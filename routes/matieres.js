const express = require("express");
const router = express.Router();
const Matiere = require("../models/Matiere");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware de vérification du token
const authenticateToken = (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token =
    authHeader && authHeader.split(" ")[0] === "Bearer"
      ? authHeader.split(" ")[1]
      : null;
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/matieres - Récupérer toutes les matières du professeur connecté
router.get("/", authenticateToken, async (req, res) => {
  try {
    const matieres = await Matiere.find({ professeurId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(matieres);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/matieres - Créer une nouvelle matière
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { nom, classes } = req.body;
    if (!nom) {
      return res.status(400).json({ message: "Nom de matière requis" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const matiere = new Matiere({
      nom,
      professeurId: req.user.id,
      professeurNom: user.name,
      classes: classes || [],
    });

    await matiere.save();

    if (classes && classes.length > 0) {
      // Étape 1 : ajouter le prof aux étudiants
      await User.updateMany(
        { userType: "etudiant", classe: { $in: classes } },
        { $addToSet: { professeurs: req.user.id } }
      );

      // Étape 2 : récupérer les étudiants concernés
      const students = await User.find({
        userType: "etudiant",
        classe: { $in: classes },
      }).select("_id");

      const studentIds = students.map((s) => s._id);

      // Ajouter ces étudiants au prof
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { etudiants: { $each: studentIds } },
      });
    }

    res.status(201).json(matiere);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT /api/matieres/:id - Modifier une matière
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { nom, classes } = req.body;

    const matiere = await Matiere.findById(req.params.id);
    if (!matiere) {
      return res.status(404).json({ message: "Matière introuvable" });
    }

    if (matiere.professeurId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const oldClasses = matiere.classes || [];

    if (nom) matiere.nom = nom;
    if (classes) matiere.classes = classes;
    matiere.updatedAt = Date.now();

    await matiere.save();

    if (classes) {
      // Retirer le prof des anciennes classes
      const removedClasses = oldClasses.filter((c) => !classes.includes(c));
      if (removedClasses.length > 0) {
        await User.updateMany(
          { userType: "etudiant", classe: { $in: removedClasses } },
          { $pull: { professeurs: req.user.id } }
        );

        const removedStudents = await User.find({
          userType: "etudiant",
          classe: { $in: removedClasses },
        }).select("_id");

        await User.findByIdAndUpdate(req.user.id, {
          $pull: { etudiants: { $in: removedStudents.map((s) => s._id) } },
        });
      }

      // Ajouter le prof aux nouvelles classes
      const addedClasses = classes.filter((c) => !oldClasses.includes(c));
      if (addedClasses.length > 0) {
        await User.updateMany(
          { userType: "etudiant", classe: { $in: addedClasses } },
          { $addToSet: { professeurs: req.user.id } }
        );

        const addedStudents = await User.find({
          userType: "etudiant",
          classe: { $in: addedClasses },
        }).select("_id");

        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: { etudiants: { $each: addedStudents.map((s) => s._id) } },
        });
      }
    }

    res.json(matiere);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE /api/matieres/:id - Supprimer une matière
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const matiere = await Matiere.findById(req.params.id);
    if (!matiere) {
      return res.status(404).json({ message: "Matière introuvable" });
    }

    if (matiere.professeurId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (matiere.classes && matiere.classes.length > 0) {
      await User.updateMany(
        { userType: "etudiant", classe: { $in: matiere.classes } },
        { $pull: { professeurs: req.user.id } }
      );

      const students = await User.find({
        userType: "etudiant",
        classe: { $in: matiere.classes },
      }).select("_id");

      await User.findByIdAndUpdate(req.user.id, {
        $pull: { etudiants: { $in: students.map((s) => s._id) } },
      });
    }

    await Matiere.findByIdAndDelete(req.params.id);
    res.json({ message: "Matière supprimée et prof retiré des étudiants" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/matieres/all - Récupérer toutes les matières
router.get("/all", async (req, res) => {
  try {
    const matieres = await Matiere.find().sort({ nom: 1 });
    const nomsUniques = [...new Set(matieres.map((m) => m.nom))];
    res.json(nomsUniques);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/matieres/student - Récupérer les matières liées à l'étudiant connecté
router.get("/student", authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Vérifier que l'utilisateur est bien un étudiant
    const student = await User.findById(studentId);
    if (!student || student.userType !== "etudiant") {
      return res.status(403).json({ message: "Accès réservé aux étudiants" });
    }

    // Récupérer toutes les matières qui contiennent la classe de l'étudiant
    const matieres = await Matiere.find({
      classes: student.classe,
    }).select("nom professeurNom professeurId classes");

    res.json(matieres);
  } catch (err) {
    console.error("Erreur backend:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


module.exports = router;
