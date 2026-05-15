const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const fs = require("fs");
const { jsPDF } = require("jspdf");

router.post("/emailReport", async (req, res) => {
    const { email, reportData } = req.body;

    const doc = new jsPDF();
    doc.text(JSON.stringify(reportData, null, 2), 10, 10);
    const pdfPath = "./report.pdf";
    doc.save(pdfPath);

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: { user: process.env.EMAIL, pass: process.env.PASS },
    });

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Your Interview Report",
        text: "See attached report",
        attachments: [{ filename: "report.pdf", path: pdfPath }],
    });

    res.json({ success: true });
});

module.exports = router;
