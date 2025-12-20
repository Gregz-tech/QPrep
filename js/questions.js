// Questions Management System
let currentQuestionBuilder = null;
let sections = [];

// Initialize Question Builder
function initQuestionBuilder() {
    sections = [];
    currentQuestionBuilder = {
        university: {
            name: "FEDERAL UNIVERSITY OF HEALTH SCIENCES, ILA-ORANGUN",
            faculty: "FACULTY OF ALLIED HEALTH SCIENCES",
            department: "DEPARTMENT OF INFORMATION TECHNOLOGY AND HEALTH INFORMATICS"
        },
        exam: {
            semester: "First",
            type: "FINAL",
            session: "2024/2025"
        },
        course: {
            code: "",
            title: "",
            units: "",
            instructions: "",
            time: ""
        },
        sections: []
    };
    
    // Add first section by default
    addNewSection();
    updatePreview();
}

// Open Question Builder
function openQuestionBuilder() {
    initQuestionBuilder();
    document.getElementById('questionBuilder').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close Question Builder
function closeQuestionBuilder() {
    document.getElementById('questionBuilder').style.display = 'none';
    document.body.style.overflow = '';
}

// Add New Section
function addNewSection() {
    const sectionId = Date.now();
    const section = {
        id: sectionId,
        title: `SECTION ${sections.length + 1}`,
        marks: "",
        questions: []
    };
    
    sections.push(section);
    renderSections();
    updatePreview();
}

// Render Sections in Builder
function renderSections() {
    const container = document.getElementById('sectionsContainer');
    if (!container) return;
    
    container.innerHTML = sections.map((section, index) => `
        <div class="section-container glass" data-id="${section.id}">
            <div class="section-header">
                <div class="section-title">
                    <h4>Section ${index + 1}</h4>
                    <input type="text" 
                           value="${section.title}" 
                           placeholder="Section Title (e.g., SECTION A)"
                           oninput="updateSectionTitle(${section.id}, this.value)">
                    <input type="text" 
                           value="${section.marks}" 
                           placeholder="Marks (e.g., 30 marks)"
                           style="width: 150px;"
                           oninput="updateSectionMarks(${section.id}, this.value)">
                </div>
                <button type="button" 
                        onclick="removeSection(${section.id})" 
                        class="remove-section">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            
            <div class="section-questions" id="questions-${section.id}">
                ${renderQuestions(section.questions, section.id)}
            </div>
            
            <button type="button" 
                    onclick="addQuestionToSection(${section.id})" 
                    class="add-question-btn">
                <i class="fas fa-plus"></i> Add Question
            </button>
        </div>
    `).join('');
}

// Render Questions in Section
function renderQuestions(questions, sectionId) {
    if (questions.length === 0) {
        return `<div class="no-questions">No questions added yet. Click "Add Question" to start.</div>`;
    }
    
    return questions.map((question, qIndex) => `
        <div class="question-item-container" data-qid="${question.id}">
            <div class="question-header">
                <div class="question-number">
                    <label>Question:</label>
                    <input type="number" 
                           value="${qIndex + 1}" 
                           min="1"
                           onchange="updateQuestionNumber(${sectionId}, ${question.id}, this.value)">
                </div>
                <button type="button" 
                        onclick="removeQuestion(${sectionId}, ${question.id})"
                        class="remove-option">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <textarea class="question-text-editor" 
                      placeholder="Enter question text (supports HTML formatting)..."
                      oninput="updateQuestionText(${sectionId}, ${question.id}, this.value)">${question.text}</textarea>
            
            <div class="options-container" id="options-${question.id}">
                ${renderOptions(question.options, sectionId, question.id)}
            </div>
            
            <button type="button" 
                    onclick="addOption(${sectionId}, ${question.id})"
                    class="add-option-btn">
                <i class="fas fa-plus-circle"></i> Add Option
            </button>
        </div>
    `).join('');
}

// Render Options for a Question
function renderOptions(options, sectionId, questionId) {
    const optionLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    return options.map((option, oIndex) => `
        <div class="option-row">
            <div class="option-label">${optionLetters[oIndex]})</div>
            <input type="text" 
                   class="option-input" 
                   value="${option.text}"
                   placeholder="Option text..."
                   oninput="updateOptionText(${sectionId}, ${question.id}, ${oIndex}, this.value)">
            <div class="correct-option ${option.correct ? 'selected' : ''}" 
                 onclick="toggleCorrectOption(${sectionId}, ${question.id}, ${oIndex})">
                <i class="fas ${option.correct ? 'fa-check' : 'fa-times'}"></i>
            </div>
            <div class="remove-option" 
                 onclick="removeOption(${sectionId}, ${question.id}, ${oIndex})">
                <i class="fas fa-trash"></i>
            </div>
        </div>
    `).join('');
}

// Add Question to Section
function addQuestionToSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const questionId = Date.now() + Math.random();
    const question = {
        id: questionId,
        text: "",
        options: [
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false }
        ],
        hasCode: false,
        code: ""
    };
    
    section.questions.push(question);
    renderSections();
    updatePreview();
}

// Add Option to Question
function addOption(sectionId, questionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;
    
    question.options.push({ text: "", correct: false });
    renderSections();
    updatePreview();
}

// Update Functions
function updateSectionTitle(sectionId, title) {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
        section.title = title;
        updatePreview();
    }
}

function updateSectionMarks(sectionId, marks) {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
        section.marks = marks;
        updatePreview();
    }
}

function updateQuestionNumber(sectionId, questionId, number) {
    // This would require reordering questions
    updatePreview();
}

function updateQuestionText(sectionId, questionId, text) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const question = section.questions.find(q => q.id === questionId);
    if (question) {
        question.text = text;
        updatePreview();
    }
}

function updateOptionText(sectionId, questionId, optionIndex, text) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const question = section.questions.find(q => q.id === questionId);
    if (question && question.options[optionIndex]) {
        question.options[optionIndex].text = text;
        updatePreview();
    }
}

function toggleCorrectOption(sectionId, questionId, optionIndex) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const question = section.questions.find(q => q.id === questionId);
    if (question && question.options[optionIndex]) {
        // Set all options to false first
        question.options.forEach(opt => opt.correct = false);
        // Set this option to true
        question.options[optionIndex].correct = true;
        renderSections();
        updatePreview();
    }
}

function removeOption(sectionId, questionId, optionIndex) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const question = section.questions.find(q => q.id === questionId);
    if (question && question.options.length > 1) {
        question.options.splice(optionIndex, 1);
        renderSections();
        updatePreview();
    }
}

function removeQuestion(sectionId, questionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const questionIndex = section.questions.findIndex(q => q.id === questionId);
    if (questionIndex > -1) {
        section.questions.splice(questionIndex, 1);
        renderSections();
        updatePreview();
    }
}

function removeSection(sectionId) {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex > -1 && sections.length > 1) {
        sections.splice(sectionIndex, 1);
        renderSections();
        updatePreview();
    }
}

// Update Live Preview
function updatePreview() {
    const preview = document.getElementById('questionPreview');
    if (!preview) return;
    
    // Update current builder object
    currentQuestionBuilder.university.name = document.getElementById('uniName').value;
    currentQuestionBuilder.university.faculty = document.getElementById('facultyName').value;
    currentQuestionBuilder.university.department = document.getElementById('departmentName').value;
    
    currentQuestionBuilder.exam.semester = document.getElementById('examSemester').value;
    currentQuestionBuilder.exam.type = document.getElementById('examType').value;
    currentQuestionBuilder.exam.session = document.getElementById('academicSession').value;
    
    currentQuestionBuilder.course.code = document.getElementById('courseCode').value;
    currentQuestionBuilder.course.title = document.getElementById('courseTitle').value;
    currentQuestionBuilder.course.units = document.getElementById('courseUnits').value;
    currentQuestionBuilder.course.instructions = document.getElementById('examInstructions').value;
    currentQuestionBuilder.course.time = document.getElementById('examTime').value;
    
    currentQuestionBuilder.sections = sections;
    
    // Generate preview HTML
    preview.innerHTML = generateExamPreview(currentQuestionBuilder);
}

// Generate Exam Preview HTML
function generateExamPreview(data) {
    if (!data.course.code) {
        return `<div class="preview-placeholder">
                    <i class="fas fa-eye-slash"></i>
                    <p>Fill in the details above to see a preview of your exam paper</p>
                </div>`;
    }
    
    return `
        <div class="exam-preview">
            <div class="exam-header">
                <h1>${data.university.name}</h1>
                <h2>${data.university.faculty}</h2>
                <h2>${data.university.department}</h2>
            </div>
            
            <div class="exam-details">
                <h3>${data.exam.semester.toUpperCase()} SEMESTER ${data.exam.type} EXAMINATION 
                    ${data.exam.session} ACADEMIC SESSION</h3>
                
                <div class="course-info">
                    <div class="course-code-title">
                        <strong>COURSE CODE:</strong> ${data.course.code} &nbsp;&nbsp;&nbsp;
                        <strong>COURSE TITLE:</strong> ${data.course.title} (${data.course.units})
                    </div>
                    <div><strong>TIME:</strong> ${data.course.time}</div>
                </div>
                
                ${data.course.instructions ? 
                    `<div class="exam-instructions">
                        <strong>Instruction:</strong> ${data.course.instructions}
                    </div>` : ''
                }
            </div>
            
            ${data.sections.map((section, sIndex) => `
                <div class="section-preview">
                    <div class="section-title-preview">
                        ${section.title} ${section.marks ? `(${section.marks})` : ''}
                    </div>
                    
                    ${section.questions.map((question, qIndex) => `
                        <div class="question-preview-item">
                            <div class="question-number-preview">
                                ${qIndex + 1}. 
                            </div>
                            <div class="question-text-preview">
                                ${formatQuestionText(question.text)}
                            </div>
                            
                            ${question.options.length > 0 ? `
                                <div class="options-preview">
                                    ${question.options.map((option, oIndex) => `
                                        <div class="option-preview ${option.correct ? 'correct' : ''}">
                                            <div class="option-letter">
                                                ${String.fromCharCode(97 + oIndex)})
                                            </div>
                                            <div class="option-text">
                                                ${option.text}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

// Format question text (handles code blocks, bold, etc.)
function formatQuestionText(text) {
    if (!text) return '';
    
    // Convert code blocks
    let formatted = text.replace(/```([\s\S]*?)```/g, '<div class="code-block">$1</div>');
    
    // Convert inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Save Full Question Paper
function saveFullQuestion() {
    // Validate required fields
    if (!currentQuestionBuilder.course.code) {
        alert('Please enter Course Code');
        return;
    }
    
    if (!currentQuestionBuilder.course.title) {
        alert('Please enter Course Title');
        return;
    }
    
    // Check if there are questions
    let totalQuestions = 0;
    currentQuestionBuilder.sections.forEach(section => {
        totalQuestions += section.questions.length;
    });
    
    if (totalQuestions === 0) {
        alert('Please add at least one question');
        return;
    }
    
    // Save to database
    saveQuestionToDatabase(currentQuestionBuilder);
    
    // Show success message
    showMobileNotification('✅ Question paper saved successfully!', 'success');
    
    // Close builder
    closeQuestionBuilder();
    
    // Refresh dashboard
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
}

// Save to Database (connect with your existing system)
function saveQuestionToDatabase(questionPaper) {
    // Generate unique ID
    const questionId = 'Q' + Date.now();
    
    // Convert to your existing format
    const simplifiedQuestions = [];
    
    questionPaper.sections.forEach(section => {
        section.questions.forEach((question, index) => {
            simplifiedQuestions.push({
                id: `${questionId}_${index + 1}`,
                q: question.text,
                options: question.options.map(opt => opt.text),
                correctAnswer: question.options.findIndex(opt => opt.correct),
                section: section.title,
                marks: section.marks
            });
        });
    });
    
    // Save to your existing question bank
    const dept = 'ITH'; // You can get this from user context
    const level = '300'; // You can get this from user context
    const courseCode = questionPaper.course.code;
    
    if (!questionBank[dept]) questionBank[dept] = {};
    if (!questionBank[dept][level]) questionBank[dept][level] = {};
    
    questionBank[dept][level][courseCode] = {
        name: questionPaper.course.title,
        sessions: {
            [questionPaper.exam.session]: {
                instructions: questionPaper.course.instructions,
                time: questionPaper.course.time,
                sections: questionPaper.sections.map(section => ({
                    title: section.title,
                    marks: section.marks,
                    questions: section.questions.map(q => ({
                        text: q.text,
                        options: q.options.map(opt => opt.text),
                        correct: q.options.findIndex(opt => opt.correct)
                    }))
                }))
            }
        }
    };
    
    // Save to localStorage
    localStorage.setItem('qprep_bank', JSON.stringify(questionBank));
    
    return questionId;
}

// Display Single Question in Viewer
function openSingleQuestionViewer(questionData) {
    const viewer = document.getElementById('singleQuestionViewer');
    const content = document.getElementById('singleQuestionContent');
    
    if (!viewer || !content) return;
    
    content.innerHTML = `
        <div class="single-question-header">
            <h3>${questionData.courseCode} - ${questionData.courseTitle}</h3>
            <div class="single-question-meta">
                <span><i class="fas fa-calendar"></i> ${questionData.session}</span>
                <span><i class="fas fa-clock"></i> ${questionData.time}</span>
                <span><i class="fas fa-layer-group"></i> ${questionData.section}</span>
            </div>
        </div>
        
        <div class="question-preview-item">
            <div class="question-text-preview">
                ${formatQuestionText(questionData.text)}
            </div>
            
            ${questionData.options.length > 0 ? `
                <div class="options-preview">
                    ${questionData.options.map((option, index) => `
                        <div class="option-preview ${index === questionData.correct ? 'correct' : ''}">
                            <div class="option-letter">
                                ${String.fromCharCode(97 + index)})
                            </div>
                            <div class="option-text">
                                ${option}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${questionData.explanation ? `
                <div class="explanation" style="margin-top: 20px; padding: 15px; background: rgba(59, 130, 246, 0.05); border-radius: 8px;">
                    <strong>Explanation:</strong> ${questionData.explanation}
                </div>
            ` : ''}
        </div>
    `;
    
    viewer.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSingleQuestionViewer() {
    document.getElementById('singleQuestionViewer').style.display = 'none';
    document.body.style.overflow = '';
}

// Update your existing renderDashboard to show questions in the new format
function renderQuestionsInGrid() {
    const grid = document.getElementById('questionsGrid');
    if (!grid) return;
    
    // Get questions from your existing questionBank
    const dept = user?.dept || 'ITH';
    const level = user?.level || '300';
    const courses = questionBank[dept]?.[level] || {};
    
    // Convert to display format
    const questionCards = Object.entries(courses).map(([courseCode, courseData]) => {
        const latestSession = Object.keys(courseData.sessions).sort().pop();
        const sessionData = courseData.sessions[latestSession];
        const totalQuestions = sessionData.sections?.reduce((sum, sec) => sum + sec.questions.length, 0) || 0;
        
        return `
            <div class="stat-card glass question-card-display" onclick="openCourseQuestions('${courseCode}')">
                <div class="icon-box blue">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="question-card-header">
                    <div>
                        <h3>${courseCode}</h3>
                        <p>${courseData.name}</p>
                    </div>
                    <span class="question-card-type">${totalQuestions} Qs</span>
                </div>
                <div class="question-card-meta">
                    <span><i class="fas fa-calendar"></i> ${latestSession}</span>
                    <span><i class="fas fa-clock"></i> ${sessionData.time || 'N/A'}</span>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = questionCards || '<p style="padding:20px;">No question papers found.</p>';
}

// Open course questions in a detailed view
function openCourseQuestions(courseCode) {
    const dept = user?.dept || 'ITH';
    const level = user?.level || '300';
    const courseData = questionBank[dept]?.[level]?.[courseCode];
    
    if (!courseData) return;
    
    const latestSession = Object.keys(courseData.sessions).sort().pop();
    const sessionData = courseData.sessions[latestSession];
    
    // You can implement a detailed course viewer here
    alert(`Opening ${courseCode} - ${courseData.name}\n\nTotal Sections: ${sessionData.sections?.length || 0}\nLatest Session: ${latestSession}`);
}