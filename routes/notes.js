const express = require("express");
const router = express.Router();
const NoteStudent = require("../models/NoteStudent");
const Exam = require("../models/Exam");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// ➡️ Soumettre une copie d'examen (étudiant)
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== "etudiant") {
      return res.status(403).json({ message: "Accès réservé aux étudiants" });
    }

    const { examId, answers, duration } = req.body;
    const studentId = req.user.id;

    // Vérifier si l'examen existe
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Examen non trouvé" });
    }

    // Vérifier si l'étudiant a déjà soumis cet examen
    const existingNote = await NoteStudent.findOne({ studentId, examId });
    if (existingNote) {
      return res.status(400).json({ message: "Examen déjà soumis" });
    }

    // Calculer le score
    let score = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = exam.questions[index];
      const isCorrect = answer.answer === question.answer;
      if (isCorrect) score++;

      return {
        questionId: question._id,
        answer: answer.answer,
        isCorrect
      };
    });

    // ✅ Score sur 20
    const finalScore = (score / exam.questions.length) * 20;

    // Sauvegarder la note
    const note = new NoteStudent({
      studentId,
      examId,
      score: finalScore,
      answers: processedAnswers,
      duration,
      status: "completed"
    });

    await note.save();

    res.status(201).json({
      message: "Examen soumis avec succès",
      score: finalScore,
      totalQuestions: exam.questions.length,
      correctAnswers: score
    });

  } catch (err) {
    console.error("Erreur soumission examen:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Récupérer les notes de l'étudiant connecté
router.get("/student", authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== "etudiant") {
      return res.status(403).json({ message: "Accès réservé aux étudiants" });
    }

    const notes = await NoteStudent.find({ studentId: req.user.id })
      .populate("examId", "title matiere dueDate")
      .sort({ submittedAt: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Récupérer les détails d'une note spécifique
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const note = await NoteStudent.findById(req.params.id)
      .populate("examId")
      .populate("studentId", "name email");

    if (!note) {
      return res.status(404).json({ message: "Note non trouvée" });
    }

    // Vérifier les permissions
    if (req.user.userType === "etudiant" && note.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➡️ Récupérer toutes les notes pour un examen (professeur)
router.get("/exam/:examId", authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== "professeur") {
      return res.status(403).json({ message: "Accès réservé aux professeurs" });
    }

    // Vérifier que le prof est bien le créateur de l'examen
    const exam = await Exam.findById(req.params.examId);
    if (!exam || exam.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const notes = await NoteStudent.find({ examId: req.params.examId })
      .populate("studentId", "name email classe")
      .sort({ score: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
