from flask import Flask, render_template, request, jsonify
import requests # 新增這行

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

# ======= 新增的 k-匿名化 API 路由 =======
@app.route('/api/pwned', methods=['POST'])
def check_pwned():
    data = request.get_json()
    
    # 確保前端有傳送前 5 碼過來
    if not data or 'prefix' not in data:
        return jsonify({"status": "error", "message": "缺少雜湊前綴"}), 400
        
    prefix = data['prefix']
    
    # 向 HIBP 官方 API 發送請求 (完全免費且不需要 API Key)
    # 官方規定只能傳送 5 碼
    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            # HIBP 回傳的是純文字格式 (每行一筆資料：後綴:外洩次數)
            # 我們直接把這串文字原封不動回傳給前端去比對
            return jsonify({
                "status": "success", 
                "data": response.text
            })
        else:
            return jsonify({"status": "error", "message": "HIBP 伺服器異常"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)