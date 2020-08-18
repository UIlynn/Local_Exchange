import json, os, re

# 현재 파일 절대 경로 저장
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 가져올 도시명 
cityName = "남양주시"

# 동을 가져올 정규식
# p = re.compile('[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]{2,4}\d{0,1}동')
p = re.compile('( |\()+([가-힣]{2,3}(\d{1,2}|)+(읍|면|동))')

# 파일명을 넣으면 동, 읍, 면 단위로 나눠주는 함수
def split_local_town_json(cityName):
    # json 파일 가져오기
    json_path = './data/{}.json'.format(cityName)# json 파일 위치
    with open(json_path,'r',encoding='utf-8') as fp:
        locs = json.load(fp)

    # 경기도 성남시 분당구 백현동
    # 경기도 의왕시 내손동
    # 경기도 남양주 호평동(읍, 면)

    results = {}
    # for l in locs[:10]:
    for l in locs:
        # print(l)
        try:
            townName = ""
            # l_addr = l.get('REFINE_LOTNO_ADDR').split()
            # if '동' in l_addr[2] or '면' in l_addr[2] or '읍' in l_addr[2]:
            #     townName = l_addr[2]
            # elif '동' in l_addr[3] or '면' in l_addr[3] or '읍' in l_addr[3]:
            #     townName = l_addr[3]
            
            # 정규 표현식으로 해야할 듯
            # \D{4}\d{0,1}동
            l_addr = l.get('REFINE_LOTNO_ADDR')
            townName = l_addr[l_addr.find(cityName):]
            townName = p.findall(townName) # '[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]{2,4}\d{0,1}동'

            # 동 면 읍 찾아진 게 없으면 스킵
            if not townName:
                continue
            # print('>>>',townName)
            
            townName = townName[0][1] 
            # print(townName) # 추출된 동이름 확인
        except Exception as e:
            # 지번 주소 없으면 contiune
            print("에러 내용 : ", print(e, ))
            continue

        # 아직 없는 동은 key를 생성하고 리스트로 저장
        if not results.get(townName):
            results[townName] = []
        results[townName].append(l)

    # 확인
    for k,v in results.items():
        # print(k, v)
        print(k)

        # data폴더가 없으면 생성
        if not os.path.isdir(os.path.join(BASE_DIR,'data')):
            os.makedirs(os.path.join(BASE_DIR,'data'))
        
        # k와 같은 폴더가 없으면 생성
        if not os.path.isdir(os.path.join(BASE_DIR,'data',cityName,k)):
            os.makedirs(os.path.join(BASE_DIR,'data',cityName,k))
        dir_name = os.path.join(BASE_DIR,'data',cityName,k)
        # print(dir_name)
        
        # json 파일로 저장 
        with open(os.path.join(dir_name,'store.json'), 'w', encoding='UTF-8') as fp:
            json.dump(v, fp, ensure_ascii=False, indent='\t')

if __name__ == "__main__":
    city_list = ['가평군','고양시','과천시','광명시','광주시','광주시','구리시','군포시','김포시','남양주시','동두천시','부천시','성남시','수원시','시흥시','안산시','안양시','양주시','양평군','여주시','연천군','오산시','용인시','의왕시','이천시','파주시','평택시','포천시','하남시','화성시']

    # split_local_town_json('광명시')
    for city in city_list:
        split_local_town_json(city)

    # for city in city_list[ city_list.index('양평군') : ]:
    #     split_local_town_json(city)
