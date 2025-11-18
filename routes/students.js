const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Exam = require("../models/Exam");
const authMiddleware = require("../middleware/auth");



// Compter les étudiants suivis par le prof connecté
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const profId = req.user.id;

    // On compte uniquement les étudiants qui ont ce prof dans leur tableau
    const count = await User.countDocuments({
      userType: "etudiant",
      professeurs: profId
    });

    res.json({ count });
  } catch (err) {
    console.error("Erreur backend:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//Etudiants connectés
router.get("/connected", authMiddleware, async (req, res) => {
  try {
    const profId = req.user.id;

    // Étudiants qui ont ce prof dans leur tableau ET sont connectés
    const students = await User.find({
      userType: "etudiant",
      professeurs: profId,
      isOnline: true 
    }).select("name email classe");

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les étudiants d'une classe donnée suivis par le prof connecté
router.get("/by-class/:classe", authMiddleware, async (req, res) => {
  try {
    const classe = req.params.classe;
    const profId = req.user.id;

    // On filtre uniquement les étudiants de cette classe ET liés au prof connecté
    const students = await User.find({
      userType: "etudiant",
      classe: classe,
      professeurs: profId
    }).select("name email classe");

    res.json(students);
  } catch (err) {
    console.error("Erreur backend:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les notes d'un étudiant pour les matières du prof connecté
router.get("/:id/notes", authMiddleware, async (req, res) => {
  try {
    const studentId = req.params.id;
    const profId = req.user.id;

    // Vérifier que l'étudiant existe
    const student = await User.findById(studentId);
    if (!student || student.userType !== "etudiant") {
      return res.status(404).json({ message: "Étudiant introuvable" });
    }

    // 🔗 Récupérer les examens créés par ce prof
    const exams = await Exam.find({ createdBy: profId });

    // 🔗 Filtrer les notes de l'étudiant pour ces examens
    // Ici j’imagine que tu as une collection "results" ou "submissions"
    // qui stocke { examId, studentId, note }
    const submissions = await Submission.find({
      studentId: studentId,
      examId: { $in: exams.map((e) => e._id) },
    }).populate("examId", "title matiere");

    const notes = submissions.map((s) => ({
      matiere: s.examId.matiere,
      note: s.note,
    }));

    res.json(notes);
  } catch (err) {
    console.error("Erreur backend:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



module.exports = router;
