from bs4 import BeautifulSoup
import requests
import time
import json
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SIGOON_LIST = ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시","화성시"]


def get_local_store(pageIndex=1, sigoonCode='고양시'):
    print("> 수집중 :", sigoonCode, pageIndex)
    url = "http://www.gmoney.or.kr/main/gmoney/searchFranchisee.do"
    params = {
        'menuNo': '040000',
        'subMenuNo': '040100',
        'pageIndex': pageIndex, # 1
        'sigoonCode': sigoonCode,
        # 'nameCode' : '검색어',
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',
    }


    time.sleep(.01) # 시간 조절

    # 테스트를 위한 break
    # if pageIndex > 5:
        # return

    # 웹 요청
    res = requests.get(url, params=params, headers=headers)
    # print(res.url)

    # 구문 분석
    soup = BeautifulSoup(res.text, 'lxml')
    # print(soup)

    # 테이블 위의 div : div.tb_type2.all_center.mgn_t10
    results = []
    trs = soup.select('div.tb_type2.all_center.mgn_t10 tbody tr')

    # trs가 한개면 검색결과가 없는 것임
    # print(len(trs))
    if len(trs) < 2:
        return

    # 테이블 수집 
    for tr in trs:
        tds = list(map(lambda x: x.text, tr.select('td')))
        tds = dict(zip(['상호명','주소','업종','전화번호'], tds))
        # print(tds)
        
        # 최상단은 버리기
        if tds: 
            results.append(tds)

    # 재귀 호출
    pageIndex += 1 # 페이지 증가
    results_add = get_local_store(pageIndex, sigoonCode)
    if results_add:
        results.extend(results_add)

    return results


# 메인 함수
def main():
    # 폴더 생성하기
    today = datetime.now().strftime("%Y%m%d%H%M")
   
    if not os.path.isdir(os.path.join(BASE_DIR,today)):
        os.makedirs(os.path.join(BASE_DIR,today))

    # 수집 함수 실행
    results = {}
    for sigoon in SIGOON_LIST:
        datas = get_local_store(sigoonCode=sigoon)
        # for d in datas:
        #     print(d)

        results = {sigoon : datas}
    
    #(백업용) json 파일로 저장 
    with open(os.path.join(BASE_DIR, today,'store.json'), 'w', encoding='UTF-8') as fp:
        json.dump(results, fp, ensure_ascii=False, indent='\t')

    #json 파일로 저장 
    with open(os.path.join(BASE_DIR,'store.json'), 'w', encoding='UTF-8') as fp:
        json.dump(results, fp, ensure_ascii=False, indent='\t')

    
# 실행 테스트
if __name__ == "__main__":
    # print(get_local_store(pageIndex=427)) # 검색결과 없음 테스트
    # 경과 시간
    start = datetime.now()
    main()
    print("걸린 시간", datetime.now()-start)