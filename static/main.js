// ==========================================
// 1. 視覺引擎初始化 (網狀數據節點與磁吸)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const mainCard = document.getElementById('mainCard');

    // 啟動背景：網狀數據節點動畫
    initNetworkCanvas();

    // 啟動玻璃卡片 3D 磁吸效果
    if (mainCard) {
        mainCard.addEventListener('mousemove', (event) => {
            const bounds = mainCard.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) - 0.5;
            const y = ((event.clientY - bounds.top) / bounds.height) - 0.5;
            mainCard.style.transform = `rotateX(${y * -10}deg) rotateY(${x * 10}deg)`;
        });

        mainCard.addEventListener('mouseleave', () => {
            mainCard.style.transform = `rotateX(0deg) rotateY(0deg)`;
        });
    }
});

// 全新背景引擎：駭客網狀數據連線 (Canvas)
function initNetworkCanvas() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let particles = [];

    // 粒子設定參數 (顏色採用你原本的 --accent-1 螢光青色)
    const properties = {
        particleColor: 'rgba(0, 245, 212, 0.8)',
        lineColor: 'rgba(0, 245, 212, ', // 後面會動態加上透明度
        particleAmount: (width * height) / 12000, // 根據螢幕大小決定節點數量
        defaultRadius: 2,
        velocity: 0.6, // 移動速度
        linkRadius: 140, // 節點連線的偵測距離
    };

    // 視窗縮放時重新計算大小
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        properties.particleAmount = (width * height) / 12000;
        initParticles();
    });

    // 定義節點 (Particle) 類別
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.velocityX = (Math.random() * (properties.velocity * 2)) - properties.velocity;
            this.velocityY = (Math.random() * (properties.velocity * 2)) - properties.velocity;
        }
        // 更新位置 (碰到邊緣會反彈)
        position() {
            this.x += this.velocityX;
            this.y += this.velocityY;
            if (this.x + properties.defaultRadius > width || this.x - properties.defaultRadius < 0) this.velocityX *= -1;
            if (this.y + properties.defaultRadius > height || this.y - properties.defaultRadius < 0) this.velocityY *= -1;
        }
        // 畫出節點
        redraw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, properties.defaultRadius, 0, Math.PI * 2);
            ctx.fillStyle = properties.particleColor;
            ctx.fill();
        }
    }

    // 初始化所有節點
    function initParticles() {
        particles = [];
        for (let i = 0; i < properties.particleAmount; i++) {
            particles.push(new Particle());
        }
    }

    // 畫出節點之間的連線
    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let x1 = particles[i].x;
                let y1 = particles[i].y;
                let x2 = particles[j].x;
                let y2 = particles[j].y;
                // 計算兩點距離
                let length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                
                // 如果距離小於設定值，就畫線（越近線越清楚）
                if (length < properties.linkRadius) {
                    let opacity = 1 - (length / properties.linkRadius);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = properties.lineColor + opacity + ')';
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }
    }

    // 動畫無窮迴圈
    function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height); // 清空畫布
        for (let i = 0; i < particles.length; i++) {
            particles[i].position();
            particles[i].redraw();
        }
        drawLines();
    }

    initParticles();
    loop();
}

// ==========================================
// 2. 密碼戰情室邏輯與 Chart.js 初始化
// (這行以下保留你原本的程式碼，完全不用動！)
// ==========================================

// ==========================================
// 2. 密碼戰情室邏輯與 Chart.js 初始化
// ==========================================
const pwdInput = document.getElementById('pwdInput');
const strengthText = document.getElementById('strengthText');
const strengthBar = document.getElementById('strengthBar');
const hashPrefix = document.getElementById('hashPrefix');
const hashSuffix = document.getElementById('hashSuffix');

const resultPanel = document.getElementById('resultPanel');
const resultTitle = document.getElementById('resultTitle');
const resultDesc = document.getElementById('resultDesc');
const countDisplay = document.getElementById('pwnedCount');

// 初始化 Chart.js
const ctx = document.getElementById('strengthChart').getContext('2d');
let strengthChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        datasets: [{
            data: [0, 5],
            backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'],
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
        }]
    },
    options: {
        aspectRatio: 2,
        cutout: '80%',
        plugins: { tooltip: { enabled: false }, legend: { display: false } }
    }
});

// ==========================================
// 3. 監聽打字事件：即時分析
// ==========================================
pwdInput.addEventListener('input', async (e) => {
    const password = e.target.value;
    resultPanel.className = 'result-panel'; // 打字時隱藏先前的結果

    if (!password) {
        resetDashboard();
        return;
    }

    // 計算分數
    let score = 0;
    if (password.length >= 8) score += 1; 
    if (/[A-Z]/.test(password)) score += 1; 
    if (/[a-z]/.test(password)) score += 1; 
    if (/[0-9]/.test(password)) score += 1; 
    if (/[^A-Za-z0-9]/.test(password)) score += 1; 

    // 定義顏色狀態 (配合老師的色票)
    const states = {
        '0': { color: 'var(--accent-3)', text: '極弱 (非常容易被破解)' },
        '1': { color: 'var(--accent-3)', text: '極弱 (非常容易被破解)' },
        '2': { color: 'var(--accent-3)', text: '弱 (容易被破解)' },
        '3': { color: 'var(--accent-2)', text: '中等 (安全性一般)' },
        '4': { color: '#00ccff', text: '強 (安全性良好)' },
        '5': { color: 'var(--accent-1)', text: '極強 (堅不可摧)' }
    };

    const currentState = states[score.toString()];

    // 更新進度條與文字
    strengthBar.style.width = `${(score / 5) * 100}%`;
    strengthBar.style.background = currentState.color;
    strengthText.innerText = `強度評估：${currentState.text}`;
    strengthText.style.color = currentState.color;

    // 更新 Chart.js
    strengthChart.data.datasets[0].data = [score, 5 - score];
    strengthChart.data.datasets[0].backgroundColor = [currentState.color, 'rgba(255,255,255,0.1)'];
    strengthChart.update();

    // 產生 SHA-1 雜湊
    const hashHex = await generateSHA1(password);
    hashPrefix.innerText = hashHex.substring(0, 5).toUpperCase();
    hashSuffix.innerText = hashHex.substring(5).toUpperCase();
});

function resetDashboard() {
    strengthBar.style.width = '0%';
    strengthText.innerText = '強度評估：等待輸入...';
    strengthText.style.color = 'var(--accent-1)';
    hashPrefix.innerText = '-----';
    hashSuffix.innerText = '-----------------------------------';
    strengthChart.data.datasets[0].data = [0, 5];
    strengthChart.data.datasets[0].backgroundColor = ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'];
    strengthChart.update();
}

async function generateSHA1(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 4. 點擊按鈕：API 串接與結果動畫
// ==========================================
document.getElementById('checkBtn').addEventListener('click', async () => {
    const prefix = hashPrefix.innerText;
    const mySuffix = hashSuffix.innerText;
    const btn = document.getElementById('checkBtn');

    if (prefix === '-----') {
        alert("存取拒絕：請先輸入密碼以產生數位指紋！");
        return;
    }

    const originalBtnText = btn.innerText;
    btn.innerText = "連線至全球外洩資料庫比對中...";
    btn.style.background = "var(--accent-2)"; 
    btn.disabled = true;
    resultPanel.className = 'result-panel';

    try {
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

            for (let line of hashList) {
                const [returnedSuffix, count] = line.trim().split(':');
                if (returnedSuffix === mySuffix) {
                    isPwned = true;
                    pwnedCount = parseInt(count);
                    break;
                }
            }

            resultPanel.className = 'result-panel show'; 

            if (isPwned) {
                resultPanel.classList.add('danger');
                resultTitle.innerText = '⚠️ 嚴重安全警告';
                resultDesc.innerText = '這組密碼已經在歷史駭客外洩事件中出現過，強烈建議您立即更換！';
                countDisplay.style.display = 'block';
                
                let startTimestamp = null;
                const duration = 1500; 
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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
        alert("[連線失敗] 無法與戰情室伺服器取得聯繫。");
    } finally {
        btn.innerText = originalBtnText;
        btn.style.background = ""; 
        btn.disabled = false;
    }
});