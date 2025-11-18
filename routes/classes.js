const express = require("express");
const router = express.Router();
const Classe = require("../models/Classe");

// GET toutes les classes
router.get("/", async (req, res) => {
  try {
    const classes = await Classe.find();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST ajouter une classe
router.post("/", async (req, res) => {
  try {
    const { id_classe, nom_class, filiereId, filiere, niveau } = req.body;
    const newClasse = new Classe({
      id_classe,
      nom_class,
      filiereId,
      filiere,
      niveau,
    });
    await newClasse.save();
    res.status(201).json(newClasse);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
