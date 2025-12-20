// Global Question Bank initialization
let questionBank = JSON.parse(localStorage.getItem('qprep_bank')) || {
    "ITH": {
        "300": {
            "ITH 303": {
                name: "Object Oriented Design and Programming",
                data: {
                    "2024/2025": {
                        "First": { 
                            instructions: "Answer all questions appropriately",
                            time: "120 mins",
                            isImagePaper: false,
                            sections: [] 
                        }
                    }
                }
            },
            "COS 201": {
                name: "Computer Science 201",
                data: {
                    "2024/2025": {
                        "First": { // Added missing Semester layer
                            instructions: "Answer all questions appropriately",
                            time: "120 mins",
                            isImagePaper: true, 
                            imagePath: "604145.jpg" 
                        }
                    }
                }
            }
        }
    }
};

// Global helper to save the bank
function saveQuestionBank() {
    localStorage.setItem('qprep_bank', JSON.stringify(questionBank));
}