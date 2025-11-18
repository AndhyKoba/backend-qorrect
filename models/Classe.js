const mongoose = require("mongoose");

const classeSchema = new mongoose.Schema({
  id_classe: {
    type: String,
    required: true,
    unique: true,
  },
  nom_class: {
    type: String,
    required: true,
  },
  filiereId: {
    type: String,
    required: true,
  },
  filiere: {
    type: String,
    required: true,
  },
  niveau: {
    type: String,
    required: true,
    enum: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Classe", classeSchema);
