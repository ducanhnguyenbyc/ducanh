document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const accessCodeInput = document.getElementById('accessCode');
    const loginError = document.getElementById('loginError');
    const loginContainer = document.getElementById('loginContainer');
    const quizApp = document.getElementById('quizApp');
    const nameDisplay = document.getElementById('nameDisplay');

    // Mã truy cập hợp lệ - Bạn nên lấy mã này từ một nguồn an toàn hơn trong ứng dụng thực tế
    const VALID_CODE = "abc123";

    loginBtn.addEventListener('click', function () {
        const username = usernameInput.value.trim();
        const code = accessCodeInput.value.trim();

        if (username && code === VALID_CODE) {
            localStorage.setItem('userName', username); // Lưu tên người dùng
            loginContainer.style.display = "none"; // Ẩn form đăng nhập
            quizApp.style.display = "flex"; // Hiện giao diện quiz
            nameDisplay.textContent = `Thí sinh: ${username}`; // Hiển thị tên

            // Tạo và gửi một sự kiện tùy chỉnh báo hiệu đăng nhập thành công
            const loginSuccessEvent = new CustomEvent('loginSuccess');
            document.dispatchEvent(loginSuccessEvent);

            loginError.textContent = ""; // Xóa thông báo lỗi nếu có
        } else if (!username) {
            loginError.textContent = "Vui lòng nhập tên đăng nhập!";
        } else {
            loginError.textContent = "Mã truy cập không đúng!";
        }
    });

    // Cho phép nhấn Enter để đăng nhập
    accessCodeInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            loginBtn.click(); // Kích hoạt sự kiện click của nút đăng nhập
        }
    });
     usernameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            accessCodeInput.focus(); // Chuyển focus đến ô mã truy cập
        }
    });
});