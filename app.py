from flask import Flask, render_template

app = Flask(__name__)

# url 설정
@app.route('/')
def main():
    return render_template('main.html')

@app.route('/map')
def map():
    return render_template('map.html')

# 맵 테스트 용
@app.route('/marker')
def marker():
    return render_template('marker.html')

@app.route('/addr')
def addr():
    return render_template('addr.html')
    
@app.route('/keyword')
def keyword():
    return render_template('keyword.html')




# 실행
if __name__ == "__main__":
    app.run(debug=True)