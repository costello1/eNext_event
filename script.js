// Function to get the value of a cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  // Function to set a cookie
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quizForm');
    const submitButton = form.querySelector('button[type="submit"]');
    let userId = getCookie('userId'); // Get user ID from cookie
  
    if (!userId) {
      userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      setCookie('userId', userId, 365);
    }
  
    // Check if the user has already responded
    const checkUserSubmission = async () => {
      const response = await fetch(`https://adminapi-7524dbiyoq-uc.a.run.app/user/${userId}`);
      const data = await response.json();
      return data.hasSubmitted;
    };
  
    const periodicCheck = async () => {
      const hasSubmitted = await checkUserSubmission();
      if (hasSubmitted) {
        submitButton.disabled = true;
        window.location.href = "thankyou.html";
      }
    };
  
    // Start periodic check every second
    setInterval(periodicCheck, 1000);
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const selectedAnswer1 = document.querySelector('input[name="answer1"]:checked');
      const selectedAnswer2 = document.querySelector('input[name="answer2"]:checked');
      // Recupera le opzioni selezionate (checkbox) per la nuova domanda
      const selectedAnswer3 = Array.from(document.querySelectorAll('input[name="answer3"]:checked')).map(input => input.value);
      // Converte l'array in stringa (ad esempio separata da virgole)
      const answer3 = selectedAnswer3.length > 0 ? selectedAnswer3.join(", ") : "";
      
      const answer4 = document.querySelector('textarea[name="answer4"]').value;
      const answer5 = document.querySelector('textarea[name="answer5"]').value;
      userId = getCookie('userId'); // Ricarica il cookie per essere sicuri
  
      const hasSubmitted = await checkUserSubmission();
      if (hasSubmitted) {
        window.location.href = "thankyou.html";
      } else {
        if (selectedAnswer1 && selectedAnswer2) {
          const answers = {
            answer1: selectedAnswer1.value,
            answer2: selectedAnswer2.value,
            answer3: answer3,    // Risposte raccolte dalla domanda a checkbox
            answer4: answer4 || "",
            answer5: answer5 || ""
          };
  
          // Invio delle risposte al backend
          await fetch(`https://adminapi-7524dbiyoq-uc.a.run.app/answers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(answers)
          });
  
          // Aggiorna lo stato dell'utente nel backend
          await fetch(`https://adminapi-7524dbiyoq-uc.a.run.app/user/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hasSubmitted: true })
          });
  
          window.location.href = "thankyou.html";
        } else {
          alert("Please complete all questions before submitting.");
        }
      }
    });
  });
  