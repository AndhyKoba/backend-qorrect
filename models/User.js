const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: {
    type: String,
    enum: ["etudiant", "professeur"],
    default: "etudiant",
  },
  filiereId: { type: String },
  filiere: { type: String },
  classe: { type: String },
  userEtablissement: { type: String },
  createdAt: { type: Date, default: Date.now },

  // Relations
  professeurs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  etudiants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Présence en ligne
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }

});

module.exports = mongoose.model("User", userSchema);
