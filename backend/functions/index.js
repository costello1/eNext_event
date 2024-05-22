const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

admin.initializeApp();

const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors({origin: true}));
app.use(express.json());

const users = {};
const answersFilePath = path.join(__dirname, "answers.xlsx");

// Questions titles
const columns = ["Question 1", "Question 2", "Question 3", "Question 4"];

// Initialize Excel file
const initializeExcelFile = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([{
    "Question 1": "",
    "Question 2": "",
    "Question 3": "",
    "Question 4": "",
  }], {skipHeader: true});
  XLSX.utils.sheet_add_aoa(worksheet, [columns], {origin: "A1"});
  XLSX.utils.book_append_sheet(workbook, worksheet, "Answers");
  XLSX.writeFile(workbook, answersFilePath);
};

if (!fs.existsSync(answersFilePath)) {
  initializeExcelFile();
}

// Function to save answers to Excel
const saveAnswersToExcel = (answers) => {
  const workbook = XLSX.readFile(answersFilePath);
  const worksheet = workbook.Sheets["Answers"];
  XLSX.utils.sheet_add_json(
      worksheet,
      [answers],
      {skipHeader: true, origin: -1});
  XLSX.writeFile(workbook, answersFilePath);
};

// Function to clear the Excel file
const clearExcelFile = () => {
  initializeExcelFile();
};

// Endpoint to check user submission status
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const user = users[userId];

  if (user) {
    res.json({hasSubmitted: user.hasSubmitted});
  } else {
    res.json({hasSubmitted: false});
  }
});

// Endpoint to update user submission status
app.post("/user/:id", (req, res) => {
  const userId = req.params.id;
  const {hasSubmitted} = req.body;

  users[userId] = {hasSubmitted};
  res.json({success: true});
});

// Endpoint to reset all users
app.post("/reset-users", (req, res) => {
  for (const userId in users) {
    if (Object.prototype.hasOwnProperty.call(users, userId)) {
      users[userId].hasSubmitted = false;
    }
  }
  res.json({success: true});
});

// Endpoint to save answers
app.post("/answers", (req, res) => {
  const answers = req.body;
  saveAnswersToExcel(answers);
  res.json({success: true});
});

// Endpoint to download the Excel file
app.get("/download-excel", (req, res) => {
  res.download(answersFilePath, "responses.xlsx", (err) => {
    if (err) {
      res.status(500).send("Error downloading the file");
    }
  });
});

// Endpoint to clear the Excel file
app.post("/clear-excel", (req, res) => {
  clearExcelFile();
  res.json({success: true});
});

// Export the express app as a Firebase Function
exports.adminApi = onRequest(app);
