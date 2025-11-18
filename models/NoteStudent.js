const mongoose = require("mongoose");

const noteStudentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  score: { type: Number, required: true, min: 0, max: 20 },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    answer: { type: String, required: false },
    isCorrect: { type: Boolean, required: true }
  }],
  submittedAt: { type: Date, default: Date.now },
  duration: { type: Number }, // temps mis en secondes
  status: {
    type: String,
    enum: ["completed", "in_progress", "not_started"],
    default: "completed"
  }
});

// ✅ Un étudiant ne peut avoir qu'une seule note par examen
noteStudentSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model("NoteStudent", noteStudentSchema);
