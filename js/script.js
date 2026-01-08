// Global state to track quiz results
let quizResults = {};

// Navigation Functions
function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active-step');
    });
    
    // Show target step
    document.getElementById(`step-${stepNumber}`).classList.add('active-step');
    
    // Update Progress Bar
    const progressItems = document.querySelectorAll('.progressbar li');
    progressItems.forEach((item, index) => {
        if (index < stepNumber) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Scroll to top
    window.scrollTo(0, 0);
}

function nextStep(stepNumber) {
    showStep(stepNumber);
}

function prevStep(stepNumber) {
    showStep(stepNumber);
}

// ==========================================
// SEARCH FUNCTIONALITY (Tags + Highlight)
// ==========================================
let searchTags = [];

const searchInput = document.getElementById('site-search');
const searchBtn = document.getElementById('search-btn');
const searchContainer = document.getElementById('search-input-container');

if (searchBtn) {
    searchBtn.addEventListener('click', addSearchTag);
}
if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addSearchTag();
        }
    });
}

function addSearchTag() {
    const term = searchInput.value.trim();
    if (!term) return;

    // Avoid duplicates
    if (!searchTags.includes(term.toLowerCase())) {
        searchTags.push(term.toLowerCase());
        renderTags();
        highlightTerms();
    }
    
    searchInput.value = ''; // Clear input
}

function removeTag(term) {
    searchTags = searchTags.filter(t => t !== term);
    renderTags();
    highlightTerms();
}

function renderTags() {
    // Remove existing tags from DOM (keep the input)
    const existingTags = searchContainer.querySelectorAll('.search-tag');
    existingTags.forEach(tag => tag.remove());

    // Add tags before the input
    searchTags.forEach(term => {
        const tag = document.createElement('span');
        tag.className = 'search-tag';
        // Escape single quotes for the onclick handler
        const escapedTerm = term.replace(/'/g, "'\\");
        tag.innerHTML = `${term} <span class="search-tag-close" onclick="removeTag('${escapedTerm}')">×</span>`;
        searchContainer.insertBefore(tag, searchInput);
    });
}

function highlightTerms() {
    // 1. Remove existing highlights
    const marks = document.querySelectorAll('mark');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
    });

    if (searchTags.length === 0) return;

    // 2. Create Regex for all terms
    // Escape special regex chars
    const escapedTerms = searchTags.map(t => t.replace(/[.*+?^${}()|[\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    
    // 3. Helper to traverse text nodes
    function traverse(element) {
        if (element.nodeType === 3) { // Text node
            const text = element.nodeValue;
            if (text.match(regex)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, '<mark>$1</mark>');
                element.parentNode.replaceChild(span, element);
            }
        } else if (element.nodeType === 1 && element.nodeName !== 'SCRIPT' && element.nodeName !== 'STYLE' && element.nodeName !== 'MARK') {
            // Recurse element nodes, ignore scripts/styles/marks
            Array.from(element.childNodes).forEach(child => traverse(child));
        }
    }

    // Search only within the main container
    const container = document.querySelector('main');
    traverse(container);
}


// ==========================================
// SLIDER LOGIC (Percentage Bubble)
// ==========================================
function updateSliderPercent(slider) {
    const wrapper = slider.parentElement;
    const bubble = wrapper.querySelector('.slider-bubble');
    
    if (bubble) {
        const val = slider.value;
        const min = slider.min ? slider.min : 0;
        const max = slider.max ? slider.max : 100;
        
        bubble.textContent = val + '%';
        
        const newVal = Number(((val - min) * 100) / (max - min));
        
        // Adjust for thumb width (approximate 24px)
        bubble.style.left = `calc(12px + (100% - 24px) * ${newVal / 100})`;
    }
}


// ==========================================
// QUIZ LOGIC
// ==========================================
function checkQuiz() {
    const form = document.getElementById('quiz-form');
    const questions = form.querySelectorAll('.quiz-question');

    questions.forEach(q => {
        const qId = q.dataset.qid;
        const selected = q.querySelector('input:checked');
        const feedbackEl = q.querySelector('.feedback');
        
        // Reset classes
        feedbackEl.className = 'feedback hidden';
        feedbackEl.innerHTML = '';

        if (selected) {
            const val = selected.value;
            const feedbackText = selected.getAttribute('data-feedback');
            
            // Store result
            quizResults[qId] = (val === 'correct');

            feedbackEl.classList.remove('hidden');
            feedbackEl.innerHTML = feedbackText;

            if (val === 'correct') {
                feedbackEl.classList.add('correct');
            } else {
                feedbackEl.classList.add('incorrect');
            }
        } else {
            // Not answered
            quizResults[qId] = false;
        }
    });

    // SHOW NEXT BUTTON
    const nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) {
        nextBtn.style.display = 'inline-block';
    }
}


// ==========================================
// SUMMARY GENERATION
// ==========================================
function generateSummary() {
    // 1. Gather Values (Sliders)
    const sliders = [
        { id: 'slider-detecting', label: 'Detecting Medical Problems' },
        { id: 'slider-diagnosis', label: 'Diagnosis Decisions' },
        { id: 'slider-notes', label: 'Medical Notes' },
        { id: 'slider-paperwork', label: 'Paperwork' },
        { id: 'slider-assistants', label: 'Virtual Assistants' },
        { id: 'slider-privacy', label: 'Privacy' },
        { id: 'slider-technical', label: 'Tech Understanding' },
        { id: 'slider-efficiency', label: 'Efficiency' },
        { id: 'slider-bias', label: 'Bias' }
    ];

    const valuesContainer = document.getElementById('summary-values');
    valuesContainer.innerHTML = '';
    
    sliders.forEach(item => {
        const val = parseInt(document.getElementById(item.id).value);
        const p = document.createElement('div');
        p.style.marginBottom = "15px";
        
        // Determine Qualifier
        let preferenceText = '';
        if (val <= 25) {
            preferenceText = "Strongly leans towards accepting AI use";
        } else if (val > 25 && val < 50) {
            preferenceText = "Moderately leans towards accepting AI use";
        } else if (val === 50) {
            preferenceText = "Undecided / Neutral";
        } else if (val > 50 && val < 75) {
            preferenceText = "Moderately leans towards Human-only care";
        } else if (val >= 75) {
            preferenceText = "Strongly leans towards Human-only care";
        }

        // Render Bar
        const barHtml = `
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                <span style="font-size: 0.8rem;">AI</span>
                <div style="flex: 1; height: 10px; background: #eee; border-radius: 5px; position: relative;">
                    <div style="position: absolute; left: ${val}%; top: -2px; width: 14px; height: 14px; background: #0056b3; border-radius: 50%; transform: translateX(-50%);"></div>
                </div>
                <span style="font-size: 0.8rem;">Human</span>
            </div>
        `;

        // Included (XX%) as requested by user prompt previously
        p.innerHTML = `<strong>${item.label}:</strong> ${preferenceText} (${val}%) ${barHtml}`;
        valuesContainer.appendChild(p);
    });

    const otherReasons = document.getElementById('other-reasons').value;
    if (otherReasons) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>Other Reasons:</strong> ${otherReasons}`;
        valuesContainer.appendChild(p);
    }

    // 2. Quiz Facts (Understanding)
    const factsList = document.getElementById('summary-facts-list');
    const reviewList = document.getElementById('summary-review-list');
    const reviewSection = document.getElementById('summary-review-needed');
    
    factsList.innerHTML = '';
    reviewList.innerHTML = '';
    reviewSection.classList.add('hidden');

    // Mapping Questions to "Fact Statements" from PDF
    const factsMap = {
        1: [
            "AI is a computer tool that learns from information and helps doctors make decisions. It does not replace doctors, however, it supports them.",
            "Doctors must always check the AI’s work and make the final decisions about your care. The doctor stays in charge, not AI."
        ],
        2: [
            "AI has a lot of uses in healthcare, some of which include reading medical images and helping doctors in finding medical problems.",
            "AI can help explain medical information to patients in simple and easy-to-understand ways."
        ],
        3: [
            "AI can sometimes give answers that are wrong or unfair because it learns from the data it is given."
        ],
        4: [
            "You have a choice in how AI is used in your care. You can agree to limit, or say no to AI, and you can always ask questions.",
            "You can ask your care team to not use AI for certain parts of your care."
        ]
    };

    let needsReview = false;

    for (let i = 1; i <= 4; i++) {
        const statements = factsMap[i];
        statements.forEach(stmt => {
            const li = document.createElement('li');
            li.textContent = stmt;
            
            if (quizResults[i]) {
                factsList.appendChild(li);
            } else {
                reviewList.appendChild(li);
                needsReview = true;
            }
        });
    }

    if (needsReview) {
        reviewSection.classList.remove('hidden');
    }

    // 3. Decision
    const comfortInput = document.querySelector('input[name="comfort"]:checked');
    let comfortText = "Not answered";
    if (comfortInput) {
        const span = comfortInput.nextElementSibling;
        if (span) comfortText = span.textContent;
    }
    document.getElementById('summary-comfort').textContent = comfortText;
    
    const decisionDetails = document.getElementById('decision-details').value;
    document.getElementById('summary-decision-comments').textContent = decisionDetails || "None";

    const certaintyInput = document.querySelector('input[name="certainty"]:checked');
    let certaintyText = "Not answered";
    if (certaintyInput) {
        const span = certaintyInput.nextElementSibling;
        if (span) certaintyText = span.textContent;
    }
    document.getElementById('summary-certainty').textContent = certaintyText;

    // 4. Next Steps
    const nextSteps = document.querySelector('input[name="next_steps"]:checked');
    const nextStepsTextMap = {
        'ready': "You feel sure about your choice and are ready to request adjustments around AI use in your care.",
        'discuss': "You feel unsure and want to talk with someone before deciding.",
        'learn': "You said you don’t fully understand your choices yet and want more information."
    };
    document.getElementById('summary-next-steps-text').textContent = nextSteps ? nextStepsTextMap[nextSteps.value] : "";

    const concerns = document.getElementById('concerns-list').value;
    document.getElementById('summary-concerns').textContent = concerns || "None";

    // Show step 5
    nextStep(5);
}

// ==========================================
// PRINT FUNCTIONS
// ==========================================

function getPrintDate() {
    const d = new Date();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function injectPrintHeader() {
    // Check if it already exists
    if (document.getElementById('print-header-info')) return;

    const summarySection = document.getElementById('step-5');
    const div = document.createElement('div');
    div.id = 'print-header-info';
    div.className = 'print-only-header';
    div.style.marginBottom = '20px';
    div.style.borderBottom = '2px solid #333';
    div.style.paddingBottom = '10px';
    
    div.innerHTML = `
        <h2>AI in Healthcare Decision Aid</h2>
        <p><strong>Developed by:</strong> Marharyta Krylova, BS</p>
        <p><strong>Last Updated:</strong> 12/11/2025</p>
        <p><strong>Date Printed:</strong> ${getPrintDate()}</p>
    `;

    summarySection.insertBefore(div, summarySection.firstChild);
}

function printSummary() {
    injectPrintHeader();
    document.body.classList.add('print-summary-mode');
    document.body.classList.remove('print-full-mode');
    window.print();
}

// Listen for afterprint to reset state
window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-summary-mode');
    document.body.classList.remove('print-full-mode');
    const printHeader = document.getElementById('print-header-info');
    if (printHeader) printHeader.remove();
});

// ==========================================
// VISUAL/TEXT MODE TOGGLE
// ==========================================
function toggleVisualMode() {
    const toggle = document.getElementById('visual-mode-toggle');
    const body = document.body;
    
    if (toggle.checked) {
        // Visual Mode
        body.classList.add('visual-mode');
        body.classList.remove('text-mode');
    } else {
        // Text Mode
        body.classList.add('text-mode');
        body.classList.remove('visual-mode');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    toggleVisualMode();
});
