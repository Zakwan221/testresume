const inputEl = document.getElementById("resumeInput");
const resultsEl = document.getElementById("results");

document.getElementById("fileInput").addEventListener("change", handleFile);

// Upload handler
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "txt") {
    const reader = new FileReader();
    reader.onload = (ev) => (inputEl.value = ev.target.result);
    reader.readAsText(file);
  } else if (ext === "pdf") {
    const reader = new FileReader();
    reader.onload = async function (ev) {
      const pdf = await pdfjsLib.getDocument(ev.target.result).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((t) => t.str).join(" ") + "\n";
      }
      inputEl.value = text;
    };
    reader.readAsArrayBuffer(file);
  } else if (ext === "docx") {
    const reader = new FileReader();
    reader.onload = function (ev) {
      mammoth.extractRawText({ arrayBuffer: ev.target.result }).then((res) => {
        inputEl.value = res.value;
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Unsupported file type. Please upload TXT, DOCX, or PDF.");
  }
}

// Example dummy checks (can expand with grammar & wording like before)
function runCheck() {
  const text = inputEl.value;
  resultsEl.innerHTML = "";
  if (!text.trim()) {
    resultsEl.innerHTML = "<p>Please upload or paste resume text.</p>";
    return;
  }

  const issues = [];

  // Simple duplicate word check
  const regex = /\b(\w+)\s+\1\b/gi;
  let match;
  while ((match = regex.exec(text))) {
    issues.push({ word: match[0], suggestion: match[1] });
  }

  if (issues.length === 0) {
    resultsEl.innerHTML = "<p>✅ No obvious issues found!</p>";
  } else {
    issues.forEach((i) => {
      const div = document.createElement("div");
      div.className = "issue";
      div.innerHTML = `
        <div><strong>${i.word}</strong> may be repeated</div>
        <div class="actions">
          <button onclick="replaceWord('${i.word}','${i.suggestion}')">Replace</button>
        </div>`;
      resultsEl.appendChild(div);
    });
  }

  document.getElementById("wordCount").textContent =
    text.split(/\s+/).filter(Boolean).length + " words";
}

function replaceWord(word, suggestion) {
  inputEl.value = inputEl.value.replace(word, suggestion);
  runCheck();
}

document.getElementById("checkBtn").addEventListener("click", runCheck);
document.getElementById("applyAllBtn").addEventListener("click", runCheck);
document.getElementById("clearBtn").addEventListener("click", () => {
  inputEl.value = "";
  resultsEl.innerHTML = "";
  document.getElementById("wordCount").textContent = "0 words";
});

