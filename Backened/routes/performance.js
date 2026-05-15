const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {

// 🔥 Replace this later with DB data
const data = {
sessions: ["S1", "S2", "S3", "S4", "S5"],
scores: [60, 70, 75, 85, 90],
average: 76,
topicBreakdown: {
DSA: 70,
OOPs: 80,
SystemDesign: 60,
HR: 90
},
weakestAreas: [
"System Design",
"Dynamic Programming",
"Behavioral Questions"
]
};

res.json(data);

});

module.exports = router;
