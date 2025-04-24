import requests
import json
from datetime import datetime

def get_weather(city="Shenzhen"):
    # Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
    api_key = "YOUR_API_KEY"
    base_url = "http://api.openweathermap.org/data/2.5/weather"
    
    params = {
        "q": city,
        "appid": api_key,
        "units": "metric"  # Use metric units (Celsius)
    }
    
    try:
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if response.status_code == 200:
            temperature = data["main"]["temp"]
            description = data["weather"][0]["description"]
            humidity = data["main"]["humidity"]
            wind_speed = data["wind"]["speed"]
            
            print(f"\n深圳天气信息:")
            print(f"温度: {temperature}°C")
            print(f"天气状况: {description}")
            print(f"湿度: {humidity}%")
            print(f"风速: {wind_speed} m/s")
        else:
            print(f"获取天气信息失败: {data['message']}")
            
    except Exception as e:
        print(f"发生错误: {str(e)}")

if __name__ == "__main__":
    get_weather() 