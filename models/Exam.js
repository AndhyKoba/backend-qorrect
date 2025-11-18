const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ["open", "qcm"], default: "open" },
  answer: { type: String }, // texte attendu ou index correct
  options: [{ type: String }] // utilisé si QCM
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },          // ✅ titre de l'examen
  matiere: { type: String, required: true },        // ✅ matière concernée
  type: { type: String, enum: ["examen", "interro"], default: "examen" },
  duration: { type: Number, required: true },       // ✅ durée en minutes
  dueDate: { type: Date, required: true },          // ✅ date et heure de l'examen
  classes: [{ type: String, required: true }],      // ✅ classes concernées
  questions: [questionSchema],                      // ✅ questions
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // prof
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Exam", examSchema);
