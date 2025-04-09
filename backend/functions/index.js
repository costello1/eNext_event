const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

admin.initializeApp();

const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors({ origin: true }));
app.use(express.json());

const users = {};
// Percorso del file Excel (attenzione: su Cloud Functions il file system è effimero)
const answersFilePath = path.join(__dirname, "answers.xlsx");

// Array delle colonne contenenti le domande complete da mostrare nell'intestazione
const columns = [
  "Which is your feedback on the Event Content?",
  "Which is your feedback on the Event Format?",
  "How did you get informed about eNEXT Waves and results?",
  "Weak points of the event and suggestions for improvement",
  "Strong points of the event"
];

// Funzione per inizializzare il file Excel con l'intestazione (prima riga)
const initializeExcelFile = () => {
  const workbook = XLSX.utils.book_new();
  // Crea la prima riga con le domande
  const worksheet = XLSX.utils.aoa_to_sheet([columns]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Answers");
  XLSX.writeFile(workbook, answersFilePath);
};

// Se il file Excel non esiste, viene creato
if (!fs.existsSync(answersFilePath)) {
  initializeExcelFile();
}

// Funzione per salvare le risposte nel file Excel
const saveAnswersToExcel = (answers) => {
  const workbook = XLSX.readFile(answersFilePath);
  const worksheet = workbook.Sheets["Answers"];

  // Mappatura delle risposte: le chiavi in answers vengono associate alle rispettive domande
  const answersMapped = {
    [columns[0]]: answers.answer1 || "",
    [columns[1]]: answers.answer2 || "",
    [columns[2]]: answers.answer3 || "",
    [columns[3]]: answers.answer4 || "",
    [columns[4]]: answers.answer5 || ""
  };

  // Aggiunge una nuova riga in fondo al foglio
  XLSX.utils.sheet_add_json(
    worksheet,
    [answersMapped],
    { skipHeader: true, origin: -1 }
  );
  XLSX.writeFile(workbook, answersFilePath);
};

// Funzione per pulire (reset) il file Excel, reinizializzandolo con l'intestazione
const clearExcelFile = () => {
  initializeExcelFile();
};

// Endpoint per controllare lo stato di invio dell’utente
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const user = users[userId];

  if (user) {
    res.json({ hasSubmitted: user.hasSubmitted });
  } else {
    res.json({ hasSubmitted: false });
  }
});

// Endpoint per aggiornare lo stato dell’utente
app.post("/user/:id", (req, res) => {
  const userId = req.params.id;
  const { hasSubmitted } = req.body;

  users[userId] = { hasSubmitted };
  res.json({ success: true });
});

// Endpoint per resettare lo stato di tutti gli utenti
app.post("/reset-users", (req, res) => {
  for (const userId in users) {
    if (Object.prototype.hasOwnProperty.call(users, userId)) {
      users[userId].hasSubmitted = false;
    }
  }
  res.json({ success: true });
});

// Endpoint per salvare le risposte (inserimento in Excel)
app.post("/answers", (req, res) => {
  const answers = req.body;
  // Mapping del payload in modo che le risposte siano collocate sotto le domande corrette
  saveAnswersToExcel(answers);
  res.json({ success: true });
});

// Endpoint per scaricare il file Excel
app.get("/download-excel", (req, res) => {
  res.download(answersFilePath, "responses.xlsx", (err) => {
    if (err) {
      res.status(500).send("Error downloading the file");
    }
  });
});

// Endpoint per pulire il file Excel
app.post("/clear-excel", (req, res) => {
  clearExcelFile();
  res.json({ success: true });
});

// Esportazione dell’app come Firebase Function
exports.adminApi = onRequest(app);
