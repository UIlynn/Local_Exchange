 // 주요 요소
 const btnSearch = document.querySelector('#btnSearch');
 const textSearch = document.querySelector('#textSearch');
 const mapContainer = document.querySelector('#mapContainer')
 const categorysBtn = document.querySelectorAll('#categorys button')
 const categorysDropdown = document.querySelectorAll('#categorys_sm .dropdown-item')
 const localSelectModalTitle = document.querySelector('#localSelectModalLabel')
 const localSelectModalBody = document.querySelector('#localSelectModalBody')

 let currentArea = []; // 현재 행정구역 정보
// let currentCityName; // 현재 도시
// let currentTownName; // 현재 동 읍 면
let currentOverlay =""; // 현재 오버레이
let currentCategoryName = "마트"; // 현재 카테고리 종류
const markers = {} // 마커 관리 보관용
const gpsBtn = document.querySelector('#gpsBtn') // 현위치 버튼
const btnCategorys_sm = document.querySelector('#btnCategorys_sm') // 작은 화면 카테고리 선택 버튼

// 초기 맵 설정
mapOption = {
    center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
    level: 3, // 지도의 확대 레벨
    maxLevel :5 // 지도 최대 레벨
};  

// kakao map 객체를 생성합니다(그리기)
const map = new kakao.maps.Map(mapContainer, mapOption); 
// 장소 검색 객체를 생성합니다
const ps = new kakao.maps.services.Places();  
// 주소-좌표 변환 객체를 생성합니다
const geocoder = new kakao.maps.services.Geocoder();


//////////// 여기서부터 함수 구현

// 전화번호 포맷팅 함수
function phoneFomatter(num, type) {
    let formatNum = '';
    if (num.length == 11) {
        if (type == 0) {
            formatNum = num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');
        } else {
            formatNum = num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
    } else if (num.length == 8) {
        formatNum = num.replace(/(\d{4})(\d{4})/, '$1-$2');
    } else {
        if (num.indexOf('02') == 0) {
            if (type == 0) {
                formatNum = num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-****-$3');
            } else {
                formatNum = num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
            }
        } else {
            if (type == 0) {
                formatNum = num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3');
            } else {
                formatNum = num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            }
        }
    }
    return formatNum;
}

// 마커 올 클리어 함수
function allClearMarkers(){
    console.log(`>allClearMarkers()`)

    for (key in markers){
        markers['성남시_운중동'].forEach(e=>{e.setMap(null)})
    }
    
    // 빈 마커로 저장
    markers = {};
}


// 마커 삭제 함수
function clearMarkers(cityName,townName){
    console.log(`>clearMarkers(${cityName},${townName})`)
    if (!markers){
        markers[`${cityName}_${townName}`].forEach(element=>{
            element.setMap(null);
        })
    // markers에서 삭제
    delete markers[`${cityName}_${townName}`]
    }else{
        // 마커가 다 사라진 경우 다시 로딩
        drawMarkStore()
    }
}


// 마우스 드래그 이벤트 정의
// 마우스 드래그로 지도 이동이 완료되었을 때 마지막 파라미터로 넘어온 함수를 호출하도록 이벤트를 등록합니다
kakao.maps.event.addListener(map, 'dragend', function() {        
    // 이동 한 곳의 가맹점 그리기
    setTimeout(drawMarkStore(),500);
});


// 오버레이 html 생성
function createOverlay(name,tel,indutype,addr_no,addr_road,lat,lng){
    // 전화번호 유무 확인
    if (tel){
        tel = phoneFomatter(`${tel}`)
    }

    let content = document.createElement('div');
    content.classList.add('overlay_div');
    content.innerHTML = `<div class="header"><span>[${indutype}]</span><span>${name}</span><a href='tel:${tel}'>${tel}</a></div>
    <div class="content">
        <p><span>지번 : </span><span>${addr_no}</span></p>
        <p><span>도로명 : </span><span>${addr_road}</span></p>
    </div>
    <div class="footer">    
        <a target="_blank" href="https://map.kakao.com/link/to/${name},${lat},${lng}"><button class="btn btn-success btn-sm">Kakao 길찾기</button></a>
        <a target="_blank" href="https://map.kakao.com/link/map/${name},${lat},${lng}"><button class="btn btn-danger btn-sm">KaKao 상세정보</button></a>
        <a target="_blank" href="http://map.naver.com/?query=${addr_no}"><button class="btn btn-danger btn-sm">Naver 위치보기</button></a>
    </div>
    `;
    return content
}

// 마커 이벤트 부여
function addMarkerEvent(marker,content){
    let overlay = new kakao.maps.CustomOverlay({
        content: content,
        map: map,
        position: marker.getPosition(),
        zIndex: 3       
    });

    overlay.setMap(null);  

    // 마커를 클릭했을 때 커스텀 오버레이를 표시합니다
    kakao.maps.event.addListener(marker, 'click', function() {
        if (currentOverlay==""){
            currentOverlay=overlay
            overlay.setMap(map);
        }else{
            currentOverlay.setMap(null);
            currentOverlay=overlay;
            currentOverlay.setMap(map);
        }
    });
}

// 지도에 마커 생성 표시
function drawMarker({CMPNM_NM: name, TELNO: tel, DATA_STD_DE: std, INDUTYPE_NM:indutype, REFINE_ROADNM_ADDR:addr_road, REFINE_LOTNO_ADDR:addr_no, REFINE_WGS84_LAT:lat, REFINE_WGS84_LOGT:lng, REFINE_ZIPNO:zip},cityName,townName){
    // console.log(name);
    
    // 위치 객체 생성
    const pos = new kakao.maps.LatLng(lat, lng);

    // 마커를 생성합니다
    const marker = new kakao.maps.Marker({
        map: map, // 마커를 표시할 지도
        position: pos, // 마커의 위치
        zIndex : 1, // 마커의 z-index
    });

    // 관리 목록에 추가 - key가 없으면 생성
    if (!markers[`${cityName}_${townName}`]){
        markers[`${cityName}_${townName}`] = []
    }
    markers[`${cityName}_${townName}`].push(marker);

    // 커스텀 오버레이에 표시할 컨텐츠 입니다
    // 커스텀 오버레이는 아래와 같이 사용자가 자유롭게 컨텐츠를 구성하고 이벤트를 제어할 수 있기 때문에
    // 별도의 이벤트 메소드를 제공하지 않습니다 
    let content = createOverlay(name,tel,indutype,addr_no,addr_road,lat,lng);

    // // 마커 위에 커스텀오버레이를 표시합니다
    // // 마커를 중심으로 커스텀 오버레이를 표시하기위해 CSS를 이용해 위치를 설정했습니다
    addMarkerEvent(marker, content);
    
}

// (임시) 커스텀 오버레이를 닫기 위해 호출되는 함수입니다 
function closeOverlay() {
    overlay.setMap(null);     
}


//////

// 지역 이름 얻기
function getCityName(result, status){
    console.dir(result); // 이곳에 행정명이 들어있음
    // console.log('>',result[0].region_2depth_name);

    // 행정구역 변화가 있는지 확인
    if (result == currentArea){
        console.log("도시 변경 없음")
        return
    }else{
        // console.log(currentArea);
        // console.log(result);
        // 1. 기존 지역에서 새로 감지된 영역 리스트에 없다면 마커를 삭제
        currentArea.forEach(current =>{
            let chk = false;
            result.forEach(r => {
                // console.log(r.code===current.code) // 지역코드가 달라도 동이 같을 수 있음

                if (r.region_1depth_name == current.region_1depth_name && r.region_2depth_name == current.region_2depth_name && r.code===current.code ){
                    chk = true;
                    // console.log(r.region_1depth_name , current.region_1depth_name)
                    // console.log(r.region_2depth_name , current.region_2depth_name)
                }
            })

            // 찾았으면 true일 것, 없다면 cityName과 townName을 찾아 삭제
            // console.log('chk', chk);
            if (!chk){
                const cityName = current.region_2depth_name.split(' ')[0];;
                const townName = current.region_3depth_name;
                clearMarkers(cityName, townName); // 마커 삭제
            }
        })

        // 2. 새롭게 currentArea를 저장
        currentArea = result;
    }

    // 맵에서 새로 갱신된 행정 구역만큼 반복
    for (let i = 0; i < currentArea.length; i++){
        // 이미 마커가 있다면 스킵
        const cityName = result[i].region_2depth_name;
        const townName = result[i].region_3depth_name;

        if (markers[`${cityName}_${townName}`]){
            console.log("이미 마커 표시지역이므로 스킵")
            continue;
        }else{
            // 가맹점 목록 가져오기
            getStoreJson(cityName, townName);
        }
        
        // 현재 도시 이름 검색
        // console.dir(result[i])
        const newCityName = result[i].region_2depth_name;
        const newTownName = result[i].region_3depth_name;
        // console.log(newCityName, newTownName);
    }
}


// 현재 지도 중심의 도시 구하고 지도에 표시하기
function drawMarkStore(){
    // 현 지도 위치부터 구한다.
    const position = map.getCenter();
    // console.dir(position);

    // 좌표로 주소 얻기
    geocoder.coord2RegionCode(position.Ga, position.Ha, getCityName);  
}

// gps 현위치로 이동 함수
function getLocation() {
    if (navigator.geolocation) { // GPS를 지원하면
        navigator.geolocation.getCurrentPosition(({ coords: { latitude, longitude } }) => {
            // console.log(latitude, longitude);
            // 이동할 위도 경도 위치를 생성합니다 
            const moveLatLon = new kakao.maps.LatLng(latitude, longitude);
            map.panTo(moveLatLon);

            // 이동 한 곳의 가맹점 그리기
            setTimeout(drawMarkStore(),500);
        })
    } else {
        alert('GPS를 지원하지 않습니다');
    }
}

// 카테고리 선택시 수행
function selectCategory(event){
    // console.dir(event.target);
    // console.log('>>>selectCategory : ', event.target.innerText);

    // 마커 모드 클리어
    allClearMarkers()

    // 모두 checked 해제
    categorysBtn.forEach(btn=>{
        btn.classList.remove('checked')
    })

    categorysDropdown.forEach(btn=>{
        btn.classList.remove('checked')
    })

    // 선택한 항목의 class중 맨뒤(업종) 클래스 확인
    const g = event.target.classList[event.target.classList.length -1];
    // console.log(g);

    // 해당 장로 모두 checked
    const check = document.querySelectorAll(`.${g}`);
    check.forEach(e=>{
        e.classList.add('checked')
    })

    // 선택 카테고리와 작은화면의 선택 카테고리 버튼 내용, 지도 마커 갱신
    currentCategoryName = event.target.innerText;
    btnCategorys_sm.innerText = event.target.innerText;
    drawMarkStore()
};

// 카테고리 버튼들에게 이벤트 추가
function addEventCategorys(){
    // categorys 이벤트 추가
    categorysBtn.forEach(element => {
       // console.log(element); 
       element.addEventListener('click',selectCategory);
    });

    // categorys_sm 에 이벤트 추가
    categorysDropdown.forEach(element =>{
        // console.log(element);
        element.addEventListener('click',selectCategory);
    });
};


// 지도 이동 함수
function panTo() {
    const [lng, lat] = [event.target.getAttribute('x'), event.target.getAttribute('y')];
    console.log(lat,lng);
    // 이동할 위도 경도 위치를 생성합니다 
    const moveLatLon = new kakao.maps.LatLng(lat, lng);
    
    // 지도 중심을 부드럽게 이동시킵니다
    // 만약 이동할 거리가 지도 화면보다 크면 부드러운 효과 없이 이동합니다
    map.panTo(moveLatLon);  
    
    // 이동 한 곳의 가맹점 그리기
    drawMarkStore();
}        


// 지역 검색 완료 시 콜백 함수
function placesSearchCB (response, status, pagination) {
    // console.dir(response);
    if (status === kakao.maps.services.Status.OK) {
        localSelectModalBody.innerHTML="";
        
        // 장소 선택 요소 만들기
        response.forEach(element =>{
            const {id, place_name, address_name, x, y} = element;
            const a = document.createElement("a");
            a.classList.add('dropdown-item');
            a.setAttribute('localId',`${id}`);
            a.setAttribute('x', x);
            a.setAttribute('y', y);
            a.innerHTML=`${place_name} : ${address_name}`
            a.addEventListener('click', panTo);
            localSelectModalBody.appendChild(a); 
        });
    } 
}


// 지역 검색 함수
function searchArea(){
    // console.log(">>> searchArea : ", textSearch.value);
    let keyword = textSearch.value;

    // 유효성 검사
    if (!keyword.replace(/^\s+|\s+$/g, '')) {
        alert('검색 지역을 입력해주세요!');
        return false;
    }

    // 키워드로 장소를 검색합니다
    ps.keywordSearch(textSearch.value, placesSearchCB); 

    // modal open
    $("#localSelectModal").modal();
    
};


// 초기화 함수
function init(){
    // 검색 버튼 이벤트 추가        
    btnSearch.addEventListener('click', searchArea);

    // 카테고리 버튼들에게 이벤트 추가
    addEventCategorys();

    // gps 권한 받기 및 현위치로 이동
    getLocation();

    // 엔터키 눌렀을 때 검색 하도록 이벤트 추가
    document.querySelector('#textSearch').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchArea()
        }
    });

    // 처음은 첫번째 카테고리를 선택하게 만듬
    categorysBtn[0].click();

    // 현위치 버튼에 현재 위치 이동 이벤트 추가
    gpsBtn.addEventListener('click',getLocation);


    // 파일 참조 테스트
    // fetch('/data/가평군/가평읍/store.json').then(response => console.dir(response.json()))
    // fetch('data/가평군/가평읍/store.json').then(response => console.dir(response.json()))
    // fetch('.data/가평군/가평읍/store.json').then(response => console.dir(response.json()))
};

init();