// ==========================================
// 1. 取得畫面上的 HTML 元素
// ==========================================
const pwdInput = document.getElementById('pwdInput');
const strengthText = document.getElementById('strengthText');
const strengthBar = document.getElementById('strengthBar');
const hashPrefix = document.getElementById('hashPrefix');
const hashSuffix = document.getElementById('hashSuffix');

// 結果面板的元素
const resultPanel = document.getElementById('resultPanel');
const resultTitle = document.getElementById('resultTitle');
const resultDesc = document.getElementById('resultDesc');
const countDisplay = document.getElementById('pwnedCount');

// ==========================================
// 2. 初始化 Chart.js 密碼強度儀表板
// ==========================================
const ctx = document.getElementById('strengthChart').getContext('2d');
let strengthChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        datasets: [{
            data: [0, 5], // [目前強度, 剩下空間]
            backgroundColor: ['#222', '#222'],
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
        }]
    },
    options: {
        aspectRatio: 2,
        cutout: '80%',
        plugins: {
            tooltip: { enabled: false },
            legend: { display: false }
        }
    }
});

// ==========================================
// 3. 監聽打字事件：即時更新圖表與產生雜湊
// ==========================================
pwdInput.addEventListener('input', async (e) => {
    const password = e.target.value;

    // 當使用者開始修改密碼時，立刻隱藏先前的比對結果面板
    resultPanel.className = 'result-panel';

    if (!password) {
        resetDashboard();
        return;
    }

    // --- 計算密碼強度分數 ---
    let score = 0;
    if (password.length >= 8) score += 1; 
    if (/[A-Z]/.test(password)) score += 1; 
    if (/[a-z]/.test(password)) score += 1; 
    if (/[0-9]/.test(password)) score += 1; 
    if (/[^A-Za-z0-9]/.test(password)) score += 1; 

    // --- 定義強度狀態 ---
    const states = {
        '0': { color: '#ff4d4d', text: '極弱 (非常容易被破解)' },
        '1': { color: '#ff4d4d', text: '極弱 (非常容易被破解)' },
        '2': { color: '#ff4d4d', text: '弱 (容易被破解)' },
        '3': { color: '#ffcc00', text: '中等 (安全性一般)' },
        '4': { color: '#00ccff', text: '強 (安全性良好)' },
        '5': { color: '#00ffcc', text: '極強 (堅不可摧)' }
    };

    const currentState = states[score.toString()];

    // --- 更新文字與進度條 ---
    strengthBar.style.width = `${(score / 5) * 100}%`;
    strengthBar.style.background = currentState.color;
    strengthText.innerText = `強度評估：${currentState.text}`;
    strengthText.style.color = currentState.color;

    // --- 更新 Chart.js 動態圖表 ---
    strengthChart.data.datasets[0].data = [score, 5 - score];
    strengthChart.data.datasets[0].backgroundColor = [currentState.color, '#222'];
    strengthChart.update();

    // --- 產生 SHA-1 雜湊指紋 ---
    const hashHex = await generateSHA1(password);
    hashPrefix.innerText = hashHex.substring(0, 5).toUpperCase();
    hashSuffix.innerText = hashHex.substring(5).toUpperCase();
});

// 重置儀表板的輔助函數
function resetDashboard() {
    strengthBar.style.width = '0%';
    strengthText.innerText = '強度評估：等待輸入...';
    strengthText.style.color = '#00ffcc';
    hashPrefix.innerText = '-----';
    hashSuffix.innerText = '-----------------------------------';
    strengthChart.data.datasets[0].data = [0, 5];
    strengthChart.data.datasets[0].backgroundColor = ['#222', '#222'];
    strengthChart.update();
}

// 本地端產生 SHA-1 雜湊 (Web Crypto API)
async function generateSHA1(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 4. 點擊按鈕：API 串接與結果面板動畫
// ==========================================
document.getElementById('checkBtn').addEventListener('click', async () => {
    const prefix = hashPrefix.innerText;
    const mySuffix = hashSuffix.innerText;
    const btn = document.getElementById('checkBtn');

    if (prefix === '-----') {
        alert("存取拒絕：請先輸入密碼以產生數位指紋！");
        return;
    }

    // 讓按鈕變成載入狀態
    const originalBtnText = btn.innerText;
    btn.innerText = "連線至全球外洩資料庫比對中...";
    btn.style.background = "#ffcc00"; 
    btn.disabled = true;
    
    // 隱藏舊的面板，準備顯示新結果
    resultPanel.className = 'result-panel';

    try {
        // 發送請求給 Python 後端 (k-匿名化前 5 碼)
        const response = await fetch('/api/pwned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix: prefix })
        });

        const result = await response.json();

        if (result.status === 'success') {
            const hashList = result.data.split('\n');
            let isPwned = false;
            let pwnedCount = 0;

            // 在本地端比對後綴
            for (let line of hashList) {
                const [returnedSuffix, count] = line.trim().split(':');
                if (returnedSuffix === mySuffix) {
                    isPwned = true;
                    pwnedCount = parseInt(count);
                    break;
                }
            }

            // --- 觸發結果面板與動畫 ---
            resultPanel.className = 'result-panel show'; // 加上 show 觸發滑入動畫

            if (isPwned) {
                resultPanel.classList.add('danger');
                resultTitle.innerText = '⚠️ 嚴重安全警告';
                resultDesc.innerText = '這組密碼已經在歷史駭客外洩事件中出現過，強烈建議您立即更換！';
                countDisplay.style.display = 'block';
                
                // 實作數字跳動動畫 (Count-Up Animation)
                let startTimestamp = null;
                const duration = 1500; // 動畫持續 1.5 秒
                
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    // 讓數字跳動先快後慢 (easeOutQuart)
                    const easeProgress = 1 - Math.pow(1 - progress, 4);
                    const currentCount = Math.floor(easeProgress * pwnedCount);
                    
                    countDisplay.innerText = currentCount.toLocaleString();
                    
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    } else {
                        countDisplay.innerText = pwnedCount.toLocaleString();
                    }
                };
                window.requestAnimationFrame(step);

            } else {
                resultPanel.classList.add('safe');
                resultTitle.innerText = '✅ 安全確認';
                resultDesc.innerText = '太棒了！這組密碼目前尚未在已知的全球資料外洩事件中發現，請繼續保持。';
                countDisplay.style.display = 'none';
            }
        } else {
            alert(`[系統錯誤] ${result.message}`);
        }

    } catch (error) {
        alert("[連線失敗] 無法與戰情室伺服器取得聯繫，請確認 Python 後端是否正在運行。");
    } finally {
        // 恢復按鈕狀態
        btn.innerText = originalBtnText;
        btn.style.background = "#00ffcc";
        btn.disabled = false;
    }
});