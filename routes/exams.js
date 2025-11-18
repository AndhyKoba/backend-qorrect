const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// ➡️ Créer un examen
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, matiere, type, duration, dueDate, classes, questions } = req.body;

    if (!title || !matiere || !classes || classes.length === 0) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const exam = new Exam({
      title,
      matiere,
      type,
      duration,
      dueDate,
      classes,
      questions,
      createdBy: req.user.id // prof connecté
    });

    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Récupérer tous les examens du prof connecté
router.get("/", authMiddleware, async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user.id });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Compter les examens du prof connecté
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const count = await Exam.countDocuments({ createdBy: req.user.id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Récupérer les examens de l'étudiant connecté
router.get("/student", authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    if (student.userType !== "etudiant") {
      return res.status(403).json({ message: "Accès réservé aux étudiants" });
    }

    if (!student.classe) {
      return res.status(400).json({ message: "Classe non définie pour l'étudiant" });
    }

    const exams = await Exam.find({ classes: { $in: [student.classe] } }).select(
      "title matiere dueDate duration"
    );

    res.json(exams);
  } catch (err) {
    console.error("Erreur backend:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Debug endpoint (no auth required)
router.get("/debug", (req, res) => {
  res.json({ message: "Server is working", timestamp: new Date() });
});

// ➡️ Récupérer un examen par ID (renvoie l'examen complet avec questions)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: "Examen introuvable" });
    }
    res.json(exam); // ✅ renvoie l'examen complet avec questions
  } catch (err) {
    console.error("Erreur backend:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Supprimer un examen
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ message: "Examen introuvable" });
    res.json({ message: "Examen supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
