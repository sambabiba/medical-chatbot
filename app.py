from flask import Flask, render_template, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Gemini API 키 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다")

# Kakao Maps API 키 설정
KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")
if not KAKAO_API_KEY:
    raise ValueError("KAKAO_API_KEY 환경 변수가 설정되지 않았습니다")

# Gemini API 초기화
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    
    # 사용자 질문에 따라 프롬프트 생성
    if "예방" in user_message:
        prompt = f"다음 질병의 예방 방법에 대해 알려주세요. 의학적으로 정확한 정보를 제공하세요: {user_message}"
    elif "증상" in user_message:
        prompt = f"다음 증상에 해당할 수 있는 질병에 대해 알려주세요. 가능성이 있는 질병을 나열하고, 반드시 의사와 상담해야 함을 강조하세요: {user_message}"
    else:
        prompt = f"의료 챗봇으로서 다음 질문에 대답해주세요. 의학적으로 정확한 정보를 제공하고, 필요시 의사와 상담할 것을 권장하세요: {user_message}"
    
    try:
        # Gemini API 호출
        response = model.generate_content(prompt)
        bot_response = response.text
        
        return jsonify({"response": bot_response})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/hospital-search')
def hospital_search():
    return render_template('hospital_search.html', kakao_api_key=KAKAO_API_KEY)

@app.route('/api/hospital-hours', methods=['GET'])
def hospital_hours():
    # 실제로는 데이터베이스나 API를 통해 병원 운영 시간을 가져와야 함
    # 여기서는 예시로 더미 데이터 반환
    place_id = request.args.get('id', '')
    
    # 더미 데이터
    hours_data = {
        "monday": "09:00-18:00",
        "tuesday": "09:00-18:00",
        "wednesday": "09:00-18:00",
        "thursday": "09:00-18:00",
        "friday": "09:00-18:00",
        "saturday": "09:00-13:00",
        "sunday": "휴진"
    }
    
    return jsonify(hours_data)

if __name__ == '__main__':
    app.run(debug=True)
import requests

@app.route('/api/ip-location', methods=['GET'])
def get_ip_location():
    try:
        # IP 기반 위치 정보 API (무료 API 사용)
        response = requests.get('https://ipapi.co/json/')
        data = response.json()
        
        # 필요한 정보만 추출
        location = {
            'lat': data.get('latitude'),
            'lng': data.get('longitude'),
            'city': data.get('city'),
            'region': data.get('region'),
            'country': data.get('country_name')
        }
        
        return jsonify(location)
    except Exception as e:
        return jsonify({'error': str(e)}), 500