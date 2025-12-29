// CONFIGURATION
const API_URL = 'https://qprep-backend-1.onrender.com/api/papers'; 

// 1. FILE CONVERTER (Images/PDF to Text)
const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// 2. THE UPLOAD LOGIC
document.getElementById('uploadBtn').addEventListener('click', async (e) => {
    e.preventDefault(); // STOP the page from refreshing!

    const btn = document.getElementById('uploadBtn');
    const originalText = btn.innerText;
    
    // UI Feedback
    btn.innerText = "Uploading to Cloud...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    try {
        // A. Get the File
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showToast("Please select a Question Paper file first.", "error");
            throw new Error("No file selected");
        }

        // B. Convert File
        console.log("Converting file...");
        const base64File = await convertToBase64(file);

        // C. Gather Form Data
        const payload = {
            courseCode: document.getElementById('courseCode').value.toUpperCase(),
            title: document.getElementById('courseTitle').value,
            year: document.getElementById('academicYear').value,
            department: document.getElementById('departmentSelect').value,
            level: document.getElementById('levelSelect').value,
            type: file.type.includes('pdf') ? 'pdf' : 'image',
            fileData: base64File
        };

        // D. Send to Render
        console.log("Sending to Backend...", payload.courseCode);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showToast("✅ Success! Question Paper uploaded to database.", "success");
            // Optional: Redirect back to dashboard
            window.location.href = 'index.html';
        } else {
            showToast("Upload Failed: " + (result.error || "Unknown error", "error"));
        }

    } catch (error) {
        console.error(error);
        if(error.message !== "No file selected") {
            showToast("Network Error. Please check your internet connection.", "error");
        }
    } finally {
        // Reset Button
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
    }
});