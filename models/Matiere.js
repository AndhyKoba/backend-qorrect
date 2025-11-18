const mongoose = require("mongoose");

const matiereSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },

    professeurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    professeurNom: { type: String, required: true },

    classes: [{ type: String, required: true }],

    description: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Matiere", matiereSchema);
