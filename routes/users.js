const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// PUT /api/users/:id - update filiere/classe (protected)
router.put("/:id", auth, async (req, res) => {
  try {
    const { filiereId, filiere, classe, userEtablissement } = req.body;
    const { id } = req.params;
    // Only allow owner to update
    if (req.user.id !== id)
      return res.status(403).json({ message: "Permission refusée" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Professors cannot have filiere/classe
    if (user.userType !== "etudiant" && (filiereId || filiere || classe)) {
      return res
        .status(400)
        .json({ message: "Professors cannot have filiere or classe" });
    }

    // Prepare update object
    const update = {};
    if (user.userType === "etudiant") {
      if (typeof filiereId !== "undefined") update.filiereId = filiereId;
      if (typeof filiere !== "undefined") update.filiere = filiere;
      if (typeof classe !== "undefined") update.classe = classe;
    }
    if (typeof userEtablissement !== "undefined")
      update.userEtablissement = userEtablissement;

    const updated = await User.findByIdAndUpdate(id, update, {
      new: true,
    }).select("-password");
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
