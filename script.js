let questions = [];
let currentIndex = 0;
let selectedAnswers = {}; // Lưu trữ { questionIndex: answerIndex }
let totalQuestions = 0;
let timerInterval;
let timeLeft = 10 * 60; // Thời gian làm bài (giây), ví dụ 10 phút
let userName = localStorage.getItem("userName") || "";
let quizState = 'loading'; // Trạng thái: loading, running, submitted, reviewing

// DOM Elements
const questionText = document.getElementById("questionText");
const answersList = document.getElementById("answersList");
const questionNav = document.getElementById("questionNav");
const progressFill = document.getElementById("progressFill");
const submitBtn = document.getElementById("submitBtn");
const timeDisplay = document.getElementById("timeLeft");
const resultContainer = document.getElementById("resultContainer");
const finalResultDisplay = document.getElementById("finalResult");
const nameDisplay = document.getElementById("nameDisplay");
const retryBtn = document.getElementById("retryBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const questionNumberSpan = document.getElementById("questionNumber");
const totalQuestionsSpan = document.getElementById("totalQuestions");

// --- KHỞI TẠO QUIZ ---
// Lắng nghe sự kiện đăng nhập thành công từ login.js
document.addEventListener('loginSuccess', initializeQuiz);

function initializeQuiz() {
    if (!userName) {
        // Trường hợp người dùng vào thẳng trang quiz mà không đăng nhập
        // Có thể chuyển hướng về trang đăng nhập hoặc hiển thị thông báo
        console.error("Không tìm thấy tên người dùng. Vui lòng đăng nhập.");
        // window.location.href = "index.html"; // Bỏ comment nếu muốn chuyển hướng
        questionText.textContent = "Lỗi: Không tìm thấy thông tin người dùng.";
        return;
    }
    nameDisplay.textContent = `Thí sinh: ${userName}`;
    fetchQuestions();
}

function fetchQuestions() {
    quizState = 'loading';
    questionText.textContent = "Đang tải câu hỏi...";
    fetch("questions100.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            if (!Array.isArray(data) || data.length === 0) {
                 throw new Error("Định dạng dữ liệu câu hỏi không hợp lệ hoặc rỗng.");
            }
            questions = data;
            totalQuestions = questions.length;
            totalQuestionsSpan.textContent = totalQuestions;
            startQuiz();
        })
        .catch((err) => {
            console.error("Lỗi tải câu hỏi:", err);
            questionText.textContent = "Không thể tải câu hỏi. Vui lòng thử lại. " + err.message;
            submitBtn.disabled = true; // Vô hiệu hóa nút nộp bài nếu không tải được câu hỏi
        });
}

function startQuiz() {
    quizState = 'running';
    currentIndex = 0;
    selectedAnswers = {};
    timeLeft = 60 * 60; // Reset thời gian
    resultContainer.style.display = "none"; // Ẩn kết quả cũ
    finalResultDisplay.innerHTML = "";
    submitBtn.disabled = false;
    submitBtn.style.display = "block";
    retryBtn.style.display = "none"; // Ẩn nút làm lại
    progressFill.style.width = `0%`;
    progressFill.textContent = `0%`;

    loadQuestion(currentIndex);
    generateNav();
    startTimer();
    updateProgress(); // Cập nhật tiến độ ban đầu
}

// --- HIỂN THỊ CÂU HỎI ---
function loadQuestion(index) {
    if (index < 0 || index >= questions.length) {
        console.error("Index câu hỏi không hợp lệ:", index);
        return;
    }
    currentIndex = index;
    const q = questions[index];
    if (!q || !q.question || !Array.isArray(q.answers)) {
        console.error("Dữ liệu câu hỏi không hợp lệ tại index:", index, q);
        questionText.textContent = "Lỗi: Dữ liệu câu hỏi không hợp lệ.";
        answersList.innerHTML = "";
        return;
    }

    questionText.textContent = `Câu ${index + 1}: ${q.question}`;
    answersList.innerHTML = ""; // Xóa các nút câu trả lời cũ

    const isReviewing = (quizState === 'submitted' || quizState === 'reviewing');
    const userAnswerIndex = selectedAnswers[index]; // Lấy câu trả lời đã chọn của người dùng cho câu này

    q.answers.forEach((a, answerIndex) => {
        const li = document.createElement("li"); // Bọc button trong li để dễ quản lý hơn nếu cần
        const btn = document.createElement("button");
        btn.textContent = a.text;
        btn.classList.add("answer-btn");
        btn.disabled = isReviewing; // Vô hiệu hóa nút nếu đang xem lại

        if (!isReviewing) {
            // Chế độ làm bài: highlight nếu đã chọn
            if (userAnswerIndex === answerIndex) {
                btn.classList.add("selected");
            }
            btn.onclick = () => selectAnswer(index, answerIndex);
        } else {
            // Chế độ xem lại: highlight đáp án đúng và đáp án đã chọn
            if (a.correct) {
                btn.classList.add("correct"); // Đánh dấu đáp án đúng
            }
            if (userAnswerIndex === answerIndex) {
                btn.classList.add("selected"); // Đánh dấu đáp án người dùng đã chọn
                if (!a.correct) {
                    btn.classList.add("wrong"); // Đánh dấu nếu người dùng chọn sai
                }
            }
             // Thêm class 'disabled' để có thể style riêng nếu cần
             btn.classList.add("disabled");
        }
        li.appendChild(btn);
        answersList.appendChild(li);
    });

    updateQuestionNumber();
    updatePrevNextButtons();
    updateNavActive(); // Cập nhật trạng thái active cho nút nav
}

// --- XỬ LÝ CHỌN CÂU TRẢ LỜI ---
function selectAnswer(qIndex, aIndex) {
    if (quizState !== 'running') return; // Chỉ cho chọn khi đang làm bài

    selectedAnswers[qIndex] = aIndex;

    // Cập nhật hiển thị nút được chọn cho câu hỏi hiện tại
    const buttons = answersList.querySelectorAll("button");
    buttons.forEach((btn, i) => {
        btn.classList.toggle("selected", i === aIndex);
    });

    updateNav(); // Cập nhật màu nút điều hướng câu hỏi
    updateProgress(); // Cập nhật thanh tiến độ

    // Tự động chuyển câu hỏi tiếp theo sau khi chọn (tùy chọn)
    // setTimeout(() => {
    //     if (currentIndex < totalQuestions - 1) {
    //         loadQuestion(currentIndex + 1);
    //     } else if (Object.keys(selectedAnswers).length === totalQuestions) {
    //          // Nếu là câu cuối và đã trả lời hết, có thể cân nhắc tự động nộp bài hoặc hiển thị thông báo
    //         console.log("Đã hoàn thành tất cả câu hỏi!");
    //     }
    // }, 300); // Chờ 0.3 giây trước khi chuyển
}

// --- ĐIỀU HƯỚNG CÂU HỎI (NAV) ---
function generateNav() {
    questionNav.innerHTML = ""; // Xóa các nút cũ
    for (let i = 0; i < questions.length; i++) {
        const btn = document.createElement("button");
        btn.textContent = i + 1;
        btn.onclick = () => {
            loadQuestion(i); // Luôn cho phép chuyển câu hỏi để xem (kể cả khi đã nộp)
        };
        questionNav.appendChild(btn);
    }
    updateNav(); // Đánh dấu các câu đã trả lời ban đầu (nếu có)
    updateNavActive(); // Đánh dấu câu hiện tại
}

function updateNav() {
    const navButtons = questionNav.querySelectorAll("button");
    navButtons.forEach((btn, i) => {
        btn.classList.toggle("answered", selectedAnswers[i] !== undefined);
    });
}

function updateNavActive() {
    const navButtons = questionNav.querySelectorAll("button");
     navButtons.forEach((btn, i) => {
        btn.classList.toggle("active", i === currentIndex); // Thêm class 'active' cho nút của câu hiện tại
     });
}


// --- THANH TIẾN ĐỘ ---
function updateProgress() {
    const answeredCount = Object.keys(selectedAnswers).length;
    const percent = totalQuestions > 0 ? Math.floor((answeredCount / totalQuestions) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressFill.textContent = `${percent}%`;
}

// --- BỘ ĐẾM THỜI GIAN ---
function startTimer() {
    clearInterval(timerInterval); // Xóa interval cũ trước khi bắt đầu cái mới
    updateTimerDisplay(); // Hiển thị thời gian ban đầu
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeDisplay.textContent = "Hết giờ";
            finishQuiz(true); // Tự động nộp bài khi hết giờ
        }
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    timeDisplay.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// --- NỘP BÀI & KẾT THÚC ---
submitBtn.onclick = () => finishQuiz(false); // Nộp bài thủ công

function finishQuiz(isTimeUp = false) {
    if (quizState !== 'running') return; // Tránh nộp nhiều lần

    quizState = 'submitted';
    clearInterval(timerInterval); // Dừng timer

    let correctCount = 0;
    questions.forEach((q, i) => {
        const userAnswerIndex = selectedAnswers[i];
        // Kiểm tra xem người dùng có trả lời câu hỏi này không VÀ câu trả lời đó có đúng không
        if (userAnswerIndex !== undefined && q.answers[userAnswerIndex]?.correct) {
            correctCount++;
        }
    });

    // Hiển thị kết quả
    finalResultDisplay.innerHTML = `Bạn đã trả lời đúng <strong>${correctCount}</strong> / <strong>${totalQuestions}</strong> câu.`;
    if (isTimeUp) {
        finalResultDisplay.innerHTML += "<br><em>(Bài nộp do hết thời gian)</em>";
    }
    resultContainer.style.display = 'block'; // Hiển thị khu vực kết quả

    // Cập nhật trạng thái UI
    submitBtn.disabled = true;
    submitBtn.style.display = "none"; // Ẩn nút nộp bài
    retryBtn.style.display = "block"; // Hiện nút làm lại
    prevBtn.disabled = false; // Cho phép xem lại câu trước
    nextBtn.disabled = false; // Cho phép xem lại câu sau
    updatePrevNextButtons(); // Cập nhật trạng thái disable nếu đang ở đầu/cuối

    // Hiển thị lại câu hỏi hiện tại ở chế độ xem lại
    loadQuestion(currentIndex);
    updateNav(); // Cập nhật lại nav phòng trường hợp hết giờ chưa kịp update
}

// --- LÀM LẠI BÀI ---
retryBtn.onclick = handleRetry;

function handleRetry() {
    // Reset trạng thái và bắt đầu lại quiz
    startQuiz();
}

// --- NÚT PREV/NEXT ---
function updateQuestionNumber() {
    questionNumberSpan.textContent = currentIndex + 1;
}

function updatePrevNextButtons() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === questions.length - 1;

     // Khi xem lại, không disable nút prev/next nữa (trừ khi ở đầu/cuối)
    // if (quizState === 'submitted' || quizState === 'reviewing') {
    //     prevBtn.disabled = currentIndex === 0;
    //     nextBtn.disabled = currentIndex === questions.length - 1;
    // }
}

prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
        loadQuestion(currentIndex - 1);
    }let questions = [];
let currentIndex = 0;
let selectedAnswers = {}; // Lưu trữ { questionIndex: answerIndex }
let totalQuestions = 0;
let timerInterval;
let timeLeft = 10 * 60; // Thời gian làm bài (giây), ví dụ 10 phút
let userName = localStorage.getItem("userName") || "";
let quizState = 'loading'; // Trạng thái: loading, running, submitted, reviewing

// DOM Elements
const questionText = document.getElementById("questionText");
const answersList = document.getElementById("answersList");
const questionNav = document.getElementById("questionNav");
const progressFill = document.getElementById("progressFill");
const submitBtn = document.getElementById("submitBtn");
const timeDisplay = document.getElementById("timeLeft");
const resultContainer = document.getElementById("resultContainer");
const finalResultDisplay = document.getElementById("finalResult");
const nameDisplay = document.getElementById("nameDisplay");
const retryBtn = document.getElementById("retryBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const questionNumberSpan = document.getElementById("questionNumber");
const totalQuestionsSpan = document.getElementById("totalQuestions");

// --- KHỞI TẠO QUIZ ---
// Lắng nghe sự kiện đăng nhập thành công từ login.js
document.addEventListener('loginSuccess', initializeQuiz);

function initializeQuiz() {
    if (!userName) {
        // Trường hợp người dùng vào thẳng trang quiz mà không đăng nhập
        // Có thể chuyển hướng về trang đăng nhập hoặc hiển thị thông báo
        console.error("Không tìm thấy tên người dùng. Vui lòng đăng nhập.");
        // window.location.href = "index.html"; // Bỏ comment nếu muốn chuyển hướng
        questionText.textContent = "Lỗi: Không tìm thấy thông tin người dùng.";
        return;
    }
    nameDisplay.textContent = `Thí sinh: ${userName}`;
    fetchQuestions();
}

function fetchQuestions() {
    quizState = 'loading';
    questionText.textContent = "Đang tải câu hỏi...";
    fetch("questions100.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            if (!Array.isArray(data) || data.length === 0) {
                 throw new Error("Định dạng dữ liệu câu hỏi không hợp lệ hoặc rỗng.");
            }
            questions = data;
            // Xáo trộn thứ tự các câu hỏi trước khi bắt đầu quiz
            shuffleArray(questions);
            totalQuestions = questions.length;
            totalQuestionsSpan.textContent = totalQuestions;
            startQuiz();
        })
        .catch((err) => {
            console.error("Lỗi tải câu hỏi:", err);
            questionText.textContent = "Không thể tải câu hỏi. Vui lòng thử lại. " + err.message;
            submitBtn.disabled = true; // Vô hiệu hóa nút nộp bài nếu không tải được câu hỏi
        });
}

// Hàm xáo trộn mảng (https://stackoverflow.com/a/12646864)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function startQuiz() {
    quizState = 'running';
    currentIndex = 0;
    selectedAnswers = {};
    timeLeft = 60 * 60; // Reset thời gian
    resultContainer.style.display = "none"; // Ẩn kết quả cũ
    finalResultDisplay.innerHTML = "";
    submitBtn.disabled = false;
    submitBtn.style.display = "block";
    retryBtn.style.display = "none"; // Ẩn nút làm lại
    progressFill.style.width = `0%`;
    progressFill.textContent = `0%`;

    loadQuestion(currentIndex);
    generateNav();
    startTimer();
    updateProgress(); // Cập nhật tiến độ ban đầu
}

// --- HIỂN THỊ CÂU HỎI ---
function loadQuestion(index) {
    if (index < 0 || index >= questions.length) {
        console.error("Index câu hỏi không hợp lệ:", index);
        return;
    }
    currentIndex = index;
    const q = questions[index];
    if (!q || !q.question || !Array.isArray(q.answers)) {
        console.error("Dữ liệu câu hỏi không hợp lệ tại index:", index, q);
        questionText.textContent = "Lỗi: Dữ liệu câu hỏi không hợp lệ.";
        answersList.innerHTML = "";
        return;
    }

    questionText.textContent = `Câu ${index + 1}: ${q.question}`;
    answersList.innerHTML = ""; // Xóa các nút câu trả lời cũ

    const isReviewing = (quizState === 'submitted' || quizState === 'reviewing');
    const userAnswerIndex = selectedAnswers[index]; // Lấy câu trả lời đã chọn của người dùng cho câu này

    q.answers.forEach((a, answerIndex) => {
        const li = document.createElement("li"); // Bọc button trong li để dễ quản lý hơn nếu cần
        const btn = document.createElement("button");
        btn.textContent = a.text;
        btn.classList.add("answer-btn");
        btn.disabled = isReviewing; // Vô hiệu hóa nút nếu đang xem lại

        if (!isReviewing) {
            // Chế độ làm bài: highlight nếu đã chọn
            if (userAnswerIndex === answerIndex) {
                btn.classList.add("selected");
            }
            btn.onclick = () => selectAnswer(index, answerIndex);
        } else {
            // Chế độ xem lại: highlight đáp án đúng và đáp án đã chọn
            if (a.correct) {
                btn.classList.add("correct"); // Đánh dấu đáp án đúng
            }
            if (userAnswerIndex === answerIndex) {
                btn.classList.add("selected"); // Đánh dấu đáp án người dùng đã chọn
                if (!a.correct) {
                    btn.classList.add("wrong"); // Đánh dấu nếu người dùng chọn sai
                }
            }
             // Thêm class 'disabled' để có thể style riêng nếu cần
             btn.classList.add("disabled");
        }
        li.appendChild(btn);
        answersList.appendChild(li);
    });

    updateQuestionNumber();
    updatePrevNextButtons();
    updateNavActive(); // Cập nhật trạng thái active cho nút nav
}

// --- XỬ LÝ CHỌN CÂU TRẢ LỜI ---
function selectAnswer(qIndex, aIndex) {
    if (quizState !== 'running') return; // Chỉ cho chọn khi đang làm bài

    selectedAnswers[qIndex] = aIndex;

    // Cập nhật hiển thị nút được chọn cho câu hỏi hiện tại
    const buttons = answersList.querySelectorAll("button");
    buttons.forEach((btn, i) => {
        btn.classList.toggle("selected", i === aIndex);
    });

    updateNav(); // Cập nhật màu nút điều hướng câu hỏi
    updateProgress(); // Cập nhật thanh tiến độ

    // Tự động chuyển câu hỏi tiếp theo sau khi chọn (tùy chọn)
    // setTimeout(() => {
    //     if (currentIndex < totalQuestions - 1) {
    //         loadQuestion(currentIndex + 1);
    //     } else if (Object.keys(selectedAnswers).length === totalQuestions) {
    //          // Nếu là câu cuối và đã trả lời hết, có thể cân nhắc tự động nộp bài hoặc hiển thị thông báo
    //         console.log("Đã hoàn thành tất cả câu hỏi!");
    //     }
    // }, 300); // Chờ 0.3 giây trước khi chuyển
}

// --- ĐIỀU HƯỚNG CÂU HỎI (NAV) ---
function generateNav() {
    questionNav.innerHTML = ""; // Xóa các nút cũ
    for (let i = 0; i < questions.length; i++) {
        const btn = document.createElement("button");
        btn.textContent = i + 1;
        btn.onclick = () => {
            loadQuestion(i); // Luôn cho phép chuyển câu hỏi để xem (kể cả khi đã nộp)
        };
        questionNav.appendChild(btn);
    }
    updateNav(); // Đánh dấu các câu đã trả lời ban đầu (nếu có)
    updateNavActive(); // Đánh dấu câu hiện tại
}

function updateNav() {
    const navButtons = questionNav.querySelectorAll("button");
    navButtons.forEach((btn, i) => {
        btn.classList.toggle("answered", selectedAnswers[i] !== undefined);
    });
}

function updateNavActive() {
    const navButtons = questionNav.querySelectorAll("button");
     navButtons.forEach((btn, i) => {
        btn.classList.toggle("active", i === currentIndex); // Thêm class 'active' cho nút của câu hiện tại
     });
}


// --- THANH TIẾN ĐỘ ---
function updateProgress() {
    const answeredCount = Object.keys(selectedAnswers).length;
    const percent = totalQuestions > 0 ? Math.floor((answeredCount / totalQuestions) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressFill.textContent = `${percent}%`;
}

// --- BỘ ĐẾM THỜI GIAN ---
function startTimer() {
    clearInterval(timerInterval); // Xóa interval cũ trước khi bắt đầu cái mới
    updateTimerDisplay(); // Hiển thị thời gian ban đầu
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeDisplay.textContent = "Hết giờ";
            finishQuiz(true); // Tự động nộp bài khi hết giờ
        }
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    timeDisplay.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// --- NỘP BÀI & KẾT THÚC ---
submitBtn.onclick = () => finishQuiz(false); // Nộp bài thủ công

function finishQuiz(isTimeUp = false) {
    if (quizState !== 'running') return; // Tránh nộp nhiều lần

    quizState = 'submitted';
    clearInterval(timerInterval); // Dừng timer

    let correctCount = 0;
    questions.forEach((q, i) => {
        const userAnswerIndex = selectedAnswers[i];
        // Kiểm tra xem người dùng có trả lời câu hỏi này không VÀ câu trả lời đó có đúng không
        if (userAnswerIndex !== undefined && q.answers[userAnswerIndex]?.correct) {
            correctCount++;
        }
    });

    // Hiển thị kết quả
    finalResultDisplay.innerHTML = `Bạn đã trả lời đúng <strong>${correctCount}</strong> / <strong>${totalQuestions}</strong> câu.`;
    if (isTimeUp) {
        finalResultDisplay.innerHTML += "<br><em>(Bài nộp do hết thời gian)</em>";
    }
    resultContainer.style.display = 'block'; // Hiển thị khu vực kết quả

    // Cập nhật trạng thái UI
    submitBtn.disabled = true;
    submitBtn.style.display = "none"; // Ẩn nút nộp bài
    retryBtn.style.display = "block"; // Hiện nút làm lại
    prevBtn.disabled = false; // Cho phép xem lại câu trước
    nextBtn.disabled = false; // Cho phép xem lại câu sau
    updatePrevNextButtons(); // Cập nhật trạng thái disable nếu đang ở đầu/cuối

    // Hiển thị lại câu hỏi hiện tại ở chế độ xem lại
    loadQuestion(currentIndex);
    updateNav(); // Cập nhật lại nav phòng trường hợp hết giờ chưa kịp update
}

// --- LÀM LẠI BÀI ---
retryBtn.onclick = handleRetry;

function handleRetry() {
    // Reset trạng thái và bắt đầu lại quiz
    startQuiz();
}

// --- NÚT PREV/NEXT ---
function updateQuestionNumber() {
    questionNumberSpan.textContent = currentIndex + 1;
}

function updatePrevNextButtons() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === questions.length - 1;

     // Khi xem lại, không disable nút prev/next nữa (trừ khi ở đầu/cuối)
    // if (quizState === 'submitted' || quizState === 'reviewing') {
    //     prevBtn.disabled = currentIndex === 0;
    //     nextBtn.disabled = currentIndex === questions.length - 1;
    // }
}

prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
        loadQuestion(currentIndex - 1);
    }
});

nextBtn.addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
        loadQuestion(currentIndex + 1);
    }
});

// --- KHỞI CHẠY BAN ĐẦU ---
// Kiểm tra nếu đã có userName (trường hợp refresh trang khi đang làm bài)
if (userName && document.getElementById('quizApp').style.display === 'flex') {
    // Nếu đang ở màn hình quiz, thử khởi tạo lại
     initializeQuiz();
} else if (!userName && document.getElementById('loginContainer').style.display !== 'none') {
     // Nếu đang ở màn hình login và chưa có userName -> Bình thường, chờ đăng nhập
     console.log("Đang chờ đăng nhập...");
} else if (!userName && document.getElementById('loginContainer').style.display === 'none') {
    // Nếu không có userName mà màn hình login bị ẩn -> Có lỗi, quay lại trang login
    window.location.href = "index.html";
}

});

nextBtn.addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
        loadQuestion(currentIndex + 1);
    }
});

// --- KHỞI CHẠY BAN ĐẦU ---
// Kiểm tra nếu đã có userName (trường hợp refresh trang khi đang làm bài)
if (userName && document.getElementById('quizApp').style.display === 'flex') {
    // Nếu đang ở màn hình quiz, thử khởi tạo lại
     initializeQuiz();
} else if (!userName && document.getElementById('loginContainer').style.display !== 'none') {
     // Nếu đang ở màn hình login và chưa có userName -> Bình thường, chờ đăng nhập
     console.log("Đang chờ đăng nhập...");
} else if (!userName && document.getElementById('loginContainer').style.display === 'none') {
    // Nếu không có userName mà màn hình login bị ẩn -> Có lỗi, quay lại trang login
    window.location.href = "index.html";
}
