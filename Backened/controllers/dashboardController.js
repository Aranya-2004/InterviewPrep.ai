const Interview = require("../models/Interview");

exports.getDashboardData = async (req, res) => {

  try {
    // Get data only for the logged-in user
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 });

    // Total sessions
    const totalSessions = interviews.length;

    // Average score
    const avgScore =
      interviews.reduce(
        (acc, curr) => acc + curr.score,
        0
      ) / interviews.length || 0;

    // Topic averages
    const topicMap = {};

    interviews.forEach((item) => {

      if (!topicMap[item.topic]) {
        topicMap[item.topic] = [];
      }

      topicMap[item.topic].push(item.score);

    });

    const topicScores =
      Object.entries(topicMap).map(
        ([topic, scores]) => ({
          name: topic,
          val: Math.floor(
            scores.reduce((a, b) => a + b, 0)
            / scores.length
          ),
          color: "#3b82f6"
        })
      );

    // Recent activity - only user's interviews
    const recentActivity =
      interviews.slice(0, 5).map((item) => ({
        type: "interview",
        label: `${item.topic} Interview (${item.difficulty})`,
        score: item.score,
        date: new Date(item.createdAt)
          .toLocaleDateString(),
        feedback: item.feedback?.substring(0, 100)
      }));

    // Final response
    res.json({

      stats: [
        {
          label: "Sessions Done",
          value: totalSessions,
          suffix: "",
          color: "#3b82f6",
          icon: "🎙",
          delta: "Total"
        },
        {
          label: "Average Score",
          value: Math.floor(avgScore),
          suffix: "%",
          color: "#0d9488",
          icon: "📊",
          delta: "Overall"
        }
      ],

      recentActivity,
      topicScores

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};