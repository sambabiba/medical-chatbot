document.addEventListener("DOMContentLoaded", function() {
    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    // 메시지 전송 함수
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === "") return;

        // 사용자 메시지 표시
        appendMessage(message, "user");
        
        // 로딩 메시지 표시
        const loadingElement = document.createElement("div");
        loadingElement.className = "message bot";
        loadingElement.textContent = "처리 중...";
        chatMessages.appendChild(loadingElement);
        
        // 스크롤 맨 아래로
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 입력 필드 비우기
        userInput.value = "";

        // 서버에 메시지 전송
        fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            // 로딩 메시지 제거
            chatMessages.removeChild(loadingElement);
            
            // 봇 응답 표시
            if (data.error) {
                appendMessage("죄송합니다. 오류가 발생했습니다: " + data.error, "bot");
            } else {
                appendMessage(data.response, "bot");
            }
        })
        .catch(error => {
            // 로딩 메시지 제거
            chatMessages.removeChild(loadingElement);
            
            // 오류 메시지 표시
            appendMessage("죄송합니다. 서버와 통신 중 오류가 발생했습니다.", "bot");
            console.error("Error:", error);
        });
    }

    // 메시지 표시 함수
    function appendMessage(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.className = `message ${sender}`;
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        
        // 스크롤 맨 아래로
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 전송 버튼 클릭 이벤트
    sendBtn.addEventListener("click", sendMessage);

    // 엔터 키 이벤트
    userInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
});