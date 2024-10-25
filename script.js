// Variabeldeklarationer
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;
let awaitingHumanConfirmation = false; // Flagga för bekräftelse

// Funktion för att känna igen jakande svar
function isAffirmativeResponse(message) {
  const affirmativeResponses = [
    "ja", "japp", "absolut", "självklart", "gärna", "okej", "ok", "yes", "ja tack", "visst", "det stämmer", "javisst", "det vill jag", "såklart", "precis"
  ];
  const lowerCaseMessage = message.toLowerCase();
  return affirmativeResponses.some(response => lowerCaseMessage.includes(response));
}

// Funktion för att koppla användaren till WhatsApp
function connectToWhatsApp() {
  const whatsappNumber = "46701234567"; // Ersätt med ditt nummer
  const message = encodeURIComponent("Hej, jag behöver hjälp.");
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;

  const incomingChatLi = document.createElement("li");
  incomingChatLi.classList.add("chat", "incoming");
  incomingChatLi.innerHTML = `
    <span class="material-symbols-outlined">smart_toy</span>
    <p>Vänligen klicka på länken för att chatta med en mänsklig kollega via WhatsApp: <a href="${whatsappLink}" target="_blank">Chatta på WhatsApp</a></p>
  `;
  chatbox.appendChild(incomingChatLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);
}

// Uppdaterad handleChat-funktion
const handleChat = () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  addMessageToHistory("user", userMessage);

  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  if (awaitingHumanConfirmation) {
    awaitingHumanConfirmation = false;

    if (isAffirmativeResponse(userMessage)) {
      const incomingChatLi = createChatLi("Jag kopplar dig nu till en mänsklig kollega.", "incoming");
      chatbox.appendChild(incomingChatLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);

      connectToWhatsApp();
      return;
    } else {
      const incomingChatLi = createChatLi("Okej, låt mig veta om jag kan hjälpa dig med något annat.", "incoming");
      chatbox.appendChild(incomingChatLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
      return;
    }
  }

  setTimeout(() => {
    const incomingChatLi = createChatLi("Skriver...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    generateResponse(incomingChatLi);
  }, 600);
};

// Uppdaterad generateResponse-funktion
const generateResponse = async (chatElement) => {
  const messageElement = chatElement.querySelector("p");

  if (!checkInternetConnection()) {
    handleOfflineResponse(chatElement);
    return;
  }

  const requestOptions = {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`  
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: previousMessages,
      max_tokens: 100 
    })
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    let aiReply = data.choices[0].message.content;
    const lowerCaseReply = aiReply.toLowerCase();

    const uncertainKeywords = [
      "jag är ledsen",
      "tyvärr",
      "jag vet inte",
      "kan tyvärr inte",
      "förstår inte",
      "beklagar",
      "osäker",
      "har inget svar",
      "kan inte hjälpa",
      "inte svar",
      "på din fråga",
      "du inte fick",
      "koppla dig",
      "kopplar dig",
      "jag ska koppla",
      "överför dig",
      "ansluter dig",
      "jag fixar en människa",
      "vänta medan jag",
      "koppla till människa",
      "riktig person",
      "mänsklig operatör",
      "jag hjälper dig att",
      "låt mig hämta",
      "behöver hjälp av en människa",
      "kan inte svara på det",
      "vill du prata med en människa",
      "kontakta support",
      "kontakta kundtjänst",
      "jag kan inte besvara",
      "inte säker på svaret",
      "kan inte ge information",
      "kan inte förstå",
      "låt mig koppla dig",
      "får inte fram ett svar",
      "jag saknar information",
      "min kunskap räcker inte",
      "hänvisar dig till en människa",
      "assistera dig",
      "koppla till",
      "prata med",
      "kontaktar oss",
      "kontakta oss",
    ];
    

    const isUncertain = uncertainKeywords.some(keyword => lowerCaseReply.includes(keyword));

    if (isUncertain) {
      aiReply = "Vill du att jag kopplar dig till en mänsklig kollega nu? Ja/Nej";
      awaitingHumanConfirmation = true; // Sätter flaggan
    }

    messageElement.textContent = aiReply;
    addMessageToHistory("assistant", aiReply);

  } catch (error) {
    messageElement.classList.add("error");
    messageElement.textContent = error.message;
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};

// Resten av din kod för eventlisteners och funktioner
// ...



// Variabel för att lagra tidigare meddelanden
let previousMessages = [
  { role: "system", content: "Använd emojis. Du är AI-assistent gjord av SmartChat till en webbplats som tillhör SmartChat och du  ska hjälpa kunder med frågor gällande företaget SmartChat och inget annat. Det är ytterst viktigt att du svarar med professionalism i din formulering på skrivarens frågor. Kort och koncist, entusiastiskt och sporrande. Mycket viktigt att du inte heller svarar på andra irrelevanta frågor som skrivare kanske ställer dig. Håll dig alltid till företaget och försök att byta tillbaka samtalsämnet lugnt och snällt, lite entusiastiskt! När skrivare frågar vad SmartChat är räcker det med en snabb pitch om vad vi säljer och hur en eventuell köpare kan dra till fördel av produkten. Om du får frågor om våran integritetspolicy kan du antingen vänligt hänvisa till vår flik på vår webbplats eller vid specifika frågor även berätta  hur vi ställer oss innan vänligt hänvisa vidare till våran flik på webbplatsen. SmartChat är ett företag startat av tre unga entreprenörer som heter William Saluveer, Simon Futtrup och Elliot Von Börtzell. SmarChat jobbar med att utveckla skräddarsydda AI chatbotar till företags hemsidor för att förenkla och simplifiera kundservice delen mellan företag och kund. Vi har alltså stött på ett problem som konsumenter. Det tar för lång tid att få svar i telefon. Det är jobbiga telefonkö öppettider. Man ska vänta i två dygn för att få svar på mail osv. Med en implementerad AI chatbot på en företagssida kan kunder alltså ställa frågor om sina ordrar eller allmänna frågor om företaget dygnet runt utan långa svarstider. Boten kan även koppla till en riktig person om ärendet i fråga antingen är lite speciellt, boten inte ger ett tillfredsställande svar eller om det bara är en preferens sak att tala med riktig person. Alla botar är skräddarsydda till alla enskilda företag till deras specifika preferenser. SmartChat är ansvarig för behandlingen av personuppgifter enligt denna policy, och du kan kontakta oss via e-post på hej@smartchat.se om du har frågor.Vi samlar in personuppgifter som företags-e-postadresser, telefonnummer till ansvariga för kundsupport eller e-handel, information om företagens produkter för att anpassa våra AI-botar, samt webbplatsinformation för att effektivt kunna besvara frågor om produkter och ordrar.SmartChat samlar endast in och hanterar information som rör företagskunder i syfte att förbättra affärsrelationer och kundupplevelser. Konsumentdata hanteras av våra kunder enligt deras dataskyddspolicy." }
];

// OpenAI API-konfiguration
const API_KEY = "sk-NY6tXnSCbqzMyL3e1Aem9Rxj_-0Ep9r3NjOKkVs2YST3BlbkFJ_8TDtcw8matCu_2DZUu5H8vi8BzEtCxFxw0Vw1asAA"; // Ersätt med din OpenAI API-nyckel
const API_URL = "https://api.openai.com/v1/chat/completions";

// Funktion för att lägga till nya meddelanden till konversationens historik
const addMessageToHistory = (role, content) => {
  previousMessages.push({ role: role, content: content });
}

// Funktion för att kontrollera om användaren har internetanslutning
const checkInternetConnection = () => {
  return navigator.onLine;
};

// Funktion för att hantera offline-svar
const handleOfflineResponse = (chatElement) => {
  const offlineResponse = "Tyvärr, du är offline. Försök igen när du har internetanslutning.";
  chatElement.querySelector("p").textContent = offlineResponse;
};

// Funktion för att generera svar från OpenAI API



// Funktion för att styla knapparna
const styleButton = (button) => {
  button.style.backgroundColor = "#333";
  button.style.color = "#fff";
  button.style.border = "none";
  button.style.padding = "8px 16px";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.style.fontSize = "0.9rem";
  button.style.transition = "background-color 0.3s ease";
  button.style.flex = "1"; // För att knapparna ska dela utrymme jämnt

  // Hover-effekt
  button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "#e69500";
  });
  button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "#333";
  });
}

const handleYesResponse = () => {
  const confirmationMessage = createChatLi("Tack för din återkoppling! 😊", "incoming");
  chatbox.appendChild(confirmationMessage);
  chatbox.scrollTo(0, chatbox.scrollHeight);
}

const handleNoResponse = () => {
  const followUpQuestion = createChatLi("Jag ber om ursäkt för detta. Vad kan jag hjälpa dig med ytterligare?", "incoming");
  chatbox.appendChild(followUpQuestion);
  chatbox.scrollTo(0, chatbox.scrollHeight);
}









// Funktion för att skicka ett förslag från bubblor
const sendSuggestion = (suggestion) => {
  if (!checkInternetConnection()) {
    const incomingChatLi = createChatLi("Tyvärr, du är offline. Försök igen när du har internetanslutning.", "incoming");
    chatbox.appendChild(incomingChatLi);
    return;
  }

  // Skicka förslaget som ett meddelande
  chatInput.value = suggestion;
  handleChat();
}

// Eventlistener för att hantera input
chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Hantera Enter-tangenten för att skicka meddelande
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

// Klickhändelse för att skicka meddelande
sendChatBtn.addEventListener("click", handleChat);

// Stäng chattboten
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Visa eller göm chattboten
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

// Funktion för att skapa en chat <li> element
const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", `${className}`);
  let chatContent = className === "outgoing" 
    ? `<p></p>` 
    : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};




const clearChat = () => {
  // Visa modalen för bekräftelse
  const modal = document.getElementById("delete-confirmation-modal");
  modal.style.display = "block";

  // Eventlistener för bekräftelseknappen
  document.getElementById("confirm-delete").addEventListener("click", () => {
    // Radera konversationen
    chatbox.innerHTML = "";

    // Återställ meddelandehistoriken till startvärdet
    previousMessages = [
      { role: "system", content: "Du ska vara väldigt trevlig och hjälpsam, du svara på kundernas frågor..." }
    ];

    // Lägg till det initiala välkomstmeddelandet
    const welcomeMessage = createChatLi("Hej! Välkommen till Prydligt.se!👋 Hur kan jag hjälpa dig idag?", "incoming");
    chatbox.appendChild(welcomeMessage);

    // Lägg tillbaka förslagsknapparna
    const suggestions = document.createElement("div");
    suggestions.classList.add("suggestions");
    suggestions.innerHTML = `
      <button onclick="sendSuggestion('Vad kostar en AI Chattbot?')">Vad kostar en AI Chattbot?</button>
      <button onclick="sendSuggestion('Hur ser ni på säkerhet?')">Hur ser ni på säkerhet?</button>
      <button onclick="sendSuggestion('Hur gynnar den min verksamhet?')">Hur gynnar den min verksamhet?</button>
    `;
    chatbox.appendChild(suggestions);

    // Lägg till "Skapad av Smartchat"-länken
    const createdBy = document.createElement("div");
    createdBy.classList.add("created-by");
    createdBy.innerHTML = `<p>Skapad av <a href="https://www.smartchat.se" target="_blank">Smartchat</a></p>`;
    chatbox.appendChild(createdBy);

    // Lägg till "Chatten har raderats"-meddelandet
    const clearMessage = document.createElement("div");
    clearMessage.classList.add("clear-message");
    clearMessage.textContent = "Chatten har raderats.";
    chatbox.appendChild(clearMessage);

    // Skrolla till botten
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Starta fade out efter 3 sekunder
    setTimeout(() => {
      clearMessage.classList.add('fade-out');
    }, 1000);

    // Ta bort meddelandet helt efter att fade out är klar (5 sekunder)
    setTimeout(() => {
      clearMessage.remove();
    }, 5000);

    // Stäng modalen
    modal.style.display = "none";
  });

  // Eventlistener för avbrytknappen
  document.getElementById("cancel-delete").addEventListener("click", () => {
    // Stäng modalen om användaren avbryter
    modal.style.display = "none";
  });
};

// Funktion för att hantera Ja eller Nej svar
function handleYesNoResponse(response) {
  // Hantera logiken för Ja eller Nej svar här
  console.log("Användaren valde:", response);
  
  // Du kan lägga till ytterligare logik beroende på svaret
  if (response === "Ja") {
    // Logik för Ja
  } else {
    // Logik för Nej
  }
}

function isAffirmativeResponse(message) {
  const affirmativeResponses = [
    "ja", "japp", "absolut", "självklart", "gärna", "okej", "ok", "yes", "ja tack", "visst", "det stämmer", "javisst", "det vill jag", "såklart", "precis"
  ];
  const lowerCaseMessage = message.toLowerCase();
  return affirmativeResponses.some(response => lowerCaseMessage.includes(response));
}
