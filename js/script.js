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

searchBtn.addEventListener('click', addSearchTag);
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addSearchTag();
    }
});

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
        const escapedTerm = term.replace(/'/g, "\\'");
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

    // Scroll to first match if new tag added (optional, might jump around too much if multiple tags)
    // For now, let's just highlight.
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
            feedbackEl.innerHTML = feedbackText; // Use the specific text provided

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
}


// ==========================================
// SUMMARY GENERATION
// ==========================================
function generateSummary() {
    // 1. Gather Values (Sliders)
    const sliders = [
        { id: 'slider-detecting', label: 'Detecting Medical Problems', left: 'Fast/Accurate (AI)', right: 'Human Judgment' },
        { id: 'slider-diagnosis', label: 'Diagnosis Decisions', left: 'Extra Tools (AI)', right: 'Human Trust' },
        { id: 'slider-notes', label: 'Medical Notes', left: 'Clear Info (AI)', right: 'Privacy/Control' },
        { id: 'slider-paperwork', label: 'Paperwork', left: 'Speed (AI)', right: 'Human Interaction' },
        { id: 'slider-assistants', label: 'Virtual Assistants', left: 'Access (AI)', right: 'Personal Guidance' },
        { id: 'slider-privacy', label: 'Privacy', left: 'Utility (AI)', right: 'Strict Privacy' },
        { id: 'slider-technical', label: 'Tech Understanding', left: 'Use it (AI)', right: 'Understand it' },
        { id: 'slider-efficiency', label: 'Efficiency', left: 'Efficiency (AI)', right: 'Less AI' },
        { id: 'slider-bias', label: 'Bias', left: 'Fairness (AI)', right: 'Human Fairness' }
    ];

    const valuesContainer = document.getElementById('summary-values');
    valuesContainer.innerHTML = '';
    
    sliders.forEach(item => {
        const val = document.getElementById(item.id).value;
        const p = document.createElement('p');
        
        let preferenceText = '';
        if (val < 40) preferenceText = "Leans towards accepting AI use";
        else if (val > 60) preferenceText = "Leans towards Human-only care";
        else preferenceText = "Undecided / Neutral";

        p.innerHTML = `<strong>${item.label}:</strong> ${preferenceText}`;
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

    // Mapping Questions to "Fact Statements" from PDF Page 8
    const factsMap = {
        1: "AI is a computer tool that learns from information and helps doctors make decisions. It does not replace doctors, however, it supports them.",
        2: "You have a choice in how AI is used in your care. You can agree to limit, or say no to AI, and you can always ask questions.",
        3: "AI has a lot of uses in healthcare, some of which include reading medical images and helping doctors in finding medical problems.",
        4: "AI can help explain medical information to patients in simple and easy-to-understand ways.",
        5: "AI can sometimes give answers that are wrong or unfair because it learns from the data it is given.",
        6: "Doctors must always check the AI’s work and make the final decisions about your care. The doctor stays in charge, not AI.",
        7: "You can ask your care team to not use AI for certain parts of your care."
    };

    let needsReview = false;

    for (let i = 1; i <= 7; i++) {
        const li = document.createElement('li');
        li.textContent = factsMap[i];
        
        if (quizResults[i]) {
            factsList.appendChild(li);
        } else {
            reviewList.appendChild(li);
            needsReview = true;
        }
    }

    if (needsReview) {
        reviewSection.classList.remove('hidden');
    }

    // 3. Decision
    const comfort = document.querySelector('input[name="comfort"]:checked');
    document.getElementById('summary-comfort').textContent = comfort ? comfort.value : "Not answered";
    
    const decisionDetails = document.getElementById('decision-details').value;
    document.getElementById('summary-decision-comments').textContent = decisionDetails || "None";

    const certainty = document.querySelector('input[name="certainty"]:checked');
    document.getElementById('summary-certainty').textContent = certainty ? certainty.value : "Not answered";

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