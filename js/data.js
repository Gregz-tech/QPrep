// Global Question Bank initialization
let questionBank = JSON.parse(localStorage.getItem('qprep_bank')) || {
   
};

// Global helper to save the bank
function saveQuestionBank() {
    localStorage.setItem('qprep_bank', JSON.stringify(questionBank));
}