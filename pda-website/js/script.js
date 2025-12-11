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

// Search Functionality
document.getElementById('search-btn').addEventListener('click', performSearch);
document.getElementById('site-search').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function performSearch() {
    const query = document.getElementById('site-search').value.trim();
    if (!query) return;

    // Remove existing highlights
    const marks = document.querySelectorAll('mark');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize(); // Merge text nodes
    });

    if (query === "") return;

    const regex = new RegExp(`(${query})`, 'gi');
    
    // Helper to traverse text nodes
    function traverse(element) {
        if (element.nodeType === 3) { // Text node
            const text = element.nodeValue;
            if (text.match(regex)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, '<mark>$1</mark>');
                element.parentNode.replaceChild(span, element);
            }
        } else if (element.nodeType === 1 && element.nodeName !== 'SCRIPT' && element.nodeName !== 'STYLE') {
            // Recurse element nodes, ignore scripts/styles
            Array.from(element.childNodes).forEach(child => traverse(child));
        }
    }

    // Search only within the main container
    const container = document.querySelector('main');
    traverse(container);

    // Scroll to first match
    const firstMatch = document.querySelector('mark');
    if (firstMatch) {
        // If the match is in a hidden step, we might need to show it?
        // For now, let's assume search is most useful on the current visible page or we just highlight.
        // If we want to be fancy, we find which step the match is in and switch to it.
        const step = firstMatch.closest('.step');
        if (step && !step.classList.contains('active-step')) {
            // Find step number
            const stepId = step.id; // step-X
            const stepNum = parseInt(stepId.split('-')[1]);
            showStep(stepNum);
        }
        firstMatch.scrollIntoView({behavior: 'smooth', block: 'center'});
    } else {
        alert('No matches found.');
    }
}


// Quiz Logic
function checkQuizAndNext() {
    const form = document.getElementById('quiz-form');
    const questions = form.querySelectorAll('.quiz-question');
    let allAnswered = true; // Optional: enforce answering

    questions.forEach(q => {
        const qId = q.dataset.qid;
        const selected = q.querySelector('input:checked');
        const feedback = q.querySelector('.feedback');
        
        // Reset classes
        feedback.className = 'feedback hidden';
        feedback.innerHTML = '';

        if (selected) {
            const val = selected.value;
            // Store result
            quizResults[qId] = (val === 'correct');

            feedback.classList.remove('hidden');
            if (val === 'correct') {
                feedback.classList.add('correct');
                feedback.innerHTML = '<strong>Correct!</strong>';
            } else {
                feedback.classList.add('incorrect');
                // We could add specific feedback text from PDF if available, 
                // but PDF essentially says "Incorrect: Reason" for each option. 
                // A generic explanation or the correct reason would be better.
                // For simplicity/time, we just indicate status or generic correction.
                // Let's look at the PDF content again...
                // The PDF lists specific responses for Incorrect options.
                // Implementing specific feedback for every wrong option is complex data entry.
                // I will just mark it Incorrect for now or show a generic "Review the facts" message.
                // Actually, the summary logic relies on *correct* answers.
                feedback.innerHTML = '<strong>Incorrect.</strong> Review the facts section if needed.';
            }
        } else {
            // Not answered
            quizResults[qId] = false;
        }
    });
    
    // Move to next step
    nextStep(4);
}

// Summary Generation
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
        // Simple visualization of the preference
        let preferenceText = '';
        if (val < 40) preferenceText = `Prefers: ${item.left}`;
        else if (val > 60) preferenceText = `Prefers: ${item.right}`;
        else preferenceText = 'Neutral / Balanced';

        p.innerHTML = `<strong>${item.label}:</strong> ${val}% towards Human side (0=AI, 100=Human). <br> <em>${preferenceText}</em>`; 
        // Wait, my HTML range is 0-100.
        // Left label (0) is usually AI in my HTML structure?
        // Let's check HTML:
        // Left: "I want AI..." -> 0
        // Right: "I prefer only human..." -> 100
        // So 0 = AI, 100 = Human.
        
        // Re-mapping text for clarity
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
