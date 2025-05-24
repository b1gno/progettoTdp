const allQuestions = [
    {
        domanda: "Quale ingrediente è presente nella Carbonara?",
        opzioni: ["Panna", "Prosciutto", "Guanciale", "Speck"],
        rispostaCorretta: "Guanciale"
    },
    {
        domanda: "Quale formaggio si usa tradizionalmente nella pizza Margherita?",
        opzioni: ["Grana Padano", "Mozzarella", "Ricotta", "Fontina"],
        rispostaCorretta: "Mozzarella"
    },
    {
        domanda: "Il Parmigiano Reggiano è un formaggio a...",
        opzioni: ["Pasta molle", "Pasta dura", "Pasta filata", "Pasta semidura"],
        rispostaCorretta: "Pasta dura"
    },
    {
        domanda: "Quale vino è tipico della Toscana?",
        opzioni: ["Chianti", "Barolo", "Prosecco", "Nero d'Avola"],
        rispostaCorretta: "Chianti"
    },
    {
        domanda: "Il Prosciutto di Parma è un prodotto...",
        opzioni: ["DOC", "IGP", "DOP", "STG"],
        rispostaCorretta: "DOP"
    },
    {
        domanda: "Il gorgonzola proviene dalla regione...",
        opzioni: ["Toscana", "Lombardia", "Emilia-Romagna", "Veneto"],
        rispostaCorretta: "Lombardia"
    },
    {
        domanda: "Il pesto alla genovese contiene...",
        opzioni: ["Prezzemolo", "Basilico", "Rucola", "Origano"],
        rispostaCorretta: "Basilico"
    },
    {
        domanda: "Il tiramisù tradizionale contiene...",
        opzioni: ["Panna", "Mascarpone", "Ricotta", "Yogurt"],
        rispostaCorretta: "Mascarpone"
    },
    {
        domanda: "Il pecorino è un formaggio fatto con...",
        opzioni: ["Latte di vacca", "Latte di capra", "Latte di pecora", "Latte misto"],
        rispostaCorretta: "Latte di pecora"
    },
    {
        domanda: "Il Lambrusco è un vino...",
        opzioni: ["Bianco fermo", "Rosso frizzante", "Rosato dolce", "Spumante secco"],
        rispostaCorretta: "Rosso frizzante"
    },
    {
        domanda: "Quale ingrediente non è presente nella pizza quattro stagioni?",
        opzioni: ["Funghi", "Prosciutto", "Salsiccia", "Carciofi"],
        rispostaCorretta: "Salsiccia"
    },
    {
        domanda: "La mortadella può contenere...",
        opzioni: ["Bacche di ginepro", "Pistacchi", "Mirtilli", "Arachidi salate"],
        rispostaCorretta: "Pistacchi"
    },
    {
        domanda: "Il Barolo viene affinato minimo...",
        opzioni: ["38 mesi", "12 mesi", "20 mesi", "30 mesi"],
        rispostaCorretta: "38 mesi"
    },
    {
        domanda: "Il salame di Felino è della provincia di...",
        opzioni: ["Piacenza", "Bologna", "Modena", "Parma"],
        rispostaCorretta: "Parma"
    },
    {
        domanda: "Le lasagne non contengono...",
        opzioni: ["Besciamella", "Basilico", "Ragù di carne", "Sfoglia all'uovo"],
        rispostaCorretta: "Basilico"
    },
];

const questions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
let currentQuestionIndex = 0;
let userAnswers = [];

const quizContainer = document.getElementById('quiz-container');
const resultsContainer = document.getElementById('risultati');
const submitButton = document.getElementById('submit');

function showQuestion(index) {
    const q = questions[index];
    const optionsHTML = q.opzioni.map(option =>
        `<label><input type="radio" name="question" value="${option}"> ${option}</label>`
    ).join("<br>");

    quizContainer.innerHTML = `
        <div class="question">
            <h3>${q.domanda}</h3>
            ${optionsHTML}
        </div>
    `;

    submitButton.textContent = (index === questions.length - 1) ? "Verifica Risposte" : "Avanti";
}

function nextStep() {
    const selected = document.querySelector('input[name="question"]:checked');
    if (!selected) {
        document.getElementById("error").innerHTML=("Seleziona una risposta prima di continuare.");
        return;
    }
    else{
        document.getElementById("error").innerHTML=""
    }

    userAnswers.push(selected.value);

    currentQuestionIndex++;

    aggiornaProgressBar();

    if (currentQuestionIndex < questions.length) {
        showQuestion(currentQuestionIndex);
    } else {
        showResults();
    }
}

function showResults() {
    let score = 0;
    let recapHTML = ``;

    questions.forEach((q, i) => {
        const userAnswer = userAnswers[i];
        const isCorrect = userAnswer === q.rispostaCorretta;
        if (isCorrect) score++;

        recapHTML += `
            <div style="margin-bottom: 15px; color:black; font-size:15px;">
                <strong>Domanda ${i + 1}:</strong> ${q.domanda}<br>
                Tua risposta: <span style="color:${isCorrect ? 'green' : 'red'}">${userAnswer}</span><br>
                Risposta corretta: <span style="color:${isCorrect ? 'green' : 'red'}"><strong>${q.rispostaCorretta}</strong> ${isCorrect ? "✅" : "❌"}</span>
            </div>
        `;
    });

    // Punteggio aggiornato
    recapHTML = `<h2 style="margin-top: -45px;">Hai totalizzato ${score} su ${questions.length} punti!</h2><hr>` + recapHTML;

    // Reset e mostra risultati
    quizContainer.innerHTML = "";
    submitButton.style.display = "none";
    resultsContainer.innerHTML = recapHTML;
    quizContainer.style = `margin-top: 5%;`;

    // Coriandoli e messaggio finale
    if (score >= 3) {
        resultsContainer.style = "color: green;";
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        resultsContainer.style = "color: red;";
        resultsContainer.innerHTML += `<p style="font-style: italic;">Ritenta, sarai più fortunato… magari dopo un piatto di lasagne! 😅</p>`;
    }

    resultsContainer.innerHTML += `<a href="quiz.html"><button id="submit">Riprova</button></a>`;

    // ✅ Mostra barra di progresso completa

    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = '100%';
    progressBar.textContent = `${questions.length} / ${questions.length}`;
    progressBar.classList.add('complete-glow');
}

function aggiornaProgressBar() {
    const percentuale = ((currentQuestionIndex) / questions.length) * 100;
    const barra = document.getElementById('progress-bar');
    
    barra.style.width = `${percentuale}%`;
    barra.textContent = `${currentQuestionIndex} / ${questions.length}`;
}

showQuestion(currentQuestionIndex);
submitButton.addEventListener('click', nextStep);

