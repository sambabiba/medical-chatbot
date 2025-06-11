document.addEventListener("DOMContentLoaded", function() {
    // DOM 요소
    const hospitalSearch = document.getElementById("hospital-search");
    const searchBtn = document.getElementById("search-btn");
    const nearbyBtn = document.getElementById("nearby-btn");
    const hospitalInfo = document.getElementById("hospital-info");
    const hospitalResults = document.getElementById("hospital-results");
    const locationStatus = document.getElementById("location-status");
    const getLocationBtn = document.getElementById("get-location-btn");
    const setLocationBtn = document.getElementById("set-location-btn");
    const locationHint = document.querySelector('.location-hint');
    
    // 전역 변수
    let userLocation = null;
    let markers = [];
    let isSelectingLocation = false;
    
    // 병원 카테고리 코드
    const HOSPITAL_CATEGORY_GROUP_CODE = 'HP8';
    const PHARMACY_CATEGORY_GROUP_CODE = 'PM9';
    
    // 카카오맵 초기화
    const container = document.getElementById("map");
    const options = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567), // 서울 시청 (기본값)
        level: 3
    };
    
    const map = new kakao.maps.Map(container, options);
    
    // 장소 검색 객체 생성
    const ps = new kakao.maps.services.Places();
    
    // 인포윈도우 생성
    const infowindow = new kakao.maps.InfoWindow({zIndex:1});
    
    // 이벤트 리스너 등록
    searchBtn.addEventListener("click", searchHospitals);
    nearbyBtn.addEventListener("click", getNearbyHospitals);
    hospitalSearch.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            searchHospitals();
        }
    });
    getLocationBtn.addEventListener('click', getUserLocation);
    setLocationBtn.addEventListener('click', startSelectingLocation);
    
    // 지도 클릭 이벤트
    kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        if (isSelectingLocation) {
            // 클릭한 위치를 사용자 위치로 설정
            userLocation = {
                lat: mouseEvent.latLng.getLat(),
                lng: mouseEvent.latLng.getLng()
            };
            
            // 마커 표시
            removeAllMarkers();  // 기존 마커 제거
            
            const userMarker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
                map: map,
                image: new kakao.maps.MarkerImage(
                    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                    new kakao.maps.Size(40, 40)
                )
            });
            
            markers.push(userMarker);
            
            // 정보 표시
            locationStatus.textContent = '위치가 설정되었습니다. 이 위치를 기준으로 병원을 검색합니다.';
            
            // 위치 선택 모드 종료
            isSelectingLocation = false;
            locationHint.classList.remove('active-hint');
        }
    });
    
    // 페이지 로드 시 사용자 위치 정보 요청
    getUserLocation();
    
    // 위치 선택 모드 시작 함수
    function startSelectingLocation() {
        isSelectingLocation = true;
        locationHint.classList.add('active-hint');
        locationStatus.textContent = '지도를 클릭하여 위치를 지정하세요.';
    }
    
    // 사용자 위치 가져오기 함수
    function getUserLocation() {
        locationStatus.textContent = "위치 정보를 가져오는 중...";
        
        if (navigator.geolocation) {
            // 위치 정보 옵션 개선
            const options = {
                enableHighAccuracy: true,  // 높은 정확도 요청
                timeout: 10000,            // 타임아웃 10초로 증가
                maximumAge: 0              // 캐시된 위치 정보 사용하지 않음
            };
            
            navigator.geolocation.getCurrentPosition(
                // 위치 가져오기 성공
                function(position) {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // 정확도 정보 표시
                    const accuracy = position.coords.accuracy;
                    
                    locationStatus.textContent = `위치 정보를 가져왔습니다. 정확도: ${Math.round(accuracy)}m`;
                    
                    // 지도 중심 위치 변경
                    map.setCenter(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
                    
                    // 모든 기존 마커 제거
                    removeAllMarkers();
                    
                    // 사용자 위치 마커 표시
                    const userMarker = new kakao.maps.Marker({
                        position: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
                        map: map,
                        image: new kakao.maps.MarkerImage(
                            'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                            new kakao.maps.Size(40, 40)
                        )
                    });
                    
                    markers.push(userMarker);
                    
                    // 정확도 반경 원 표시
                    const circle = new kakao.maps.Circle({
                        center: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
                        radius: accuracy,  // 정확도 반경
                        strokeWeight: 1,
                        strokeColor: '#00a0e9',
                        strokeOpacity: 0.7,
                        strokeStyle: 'solid',
                        fillColor: '#00a0e9',
                        fillOpacity: 0.2
                    });
                    
                    circle.setMap(map);
                    
                    // 정확도를 고려한 적절한 지도 레벨 설정
                    let zoomLevel = 3;  // 기본 줌 레벨
                    
                    if (accuracy > 500) {
                        zoomLevel = 4;  // 정확도가 낮으면 줌 아웃
                    } else if (accuracy < 100) {
                        zoomLevel = 2;  // 정확도가 높으면 줌 인
                    }
                    
                    map.setLevel(zoomLevel);
                    
                    // 사용자 위치 인포윈도우 표시
                    const userInfo = new kakao.maps.InfoWindow({
                        content: '<div style="padding:5px;font-size:12px;">내 위치</div>'
                    });
                    userInfo.open(map, userMarker);
                    
                    setTimeout(function() {
                        userInfo.close();
                    }, 3000);
                },
                // 위치 가져오기 실패
                function(error) {
                    let errorMessage = "위치 정보를 가져오는데 실패했습니다. ";
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += "위치 접근 권한이 거부되었습니다.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += "위치 정보를 사용할 수 없습니다.";
                            break;
                        case error.TIMEOUT:
                            errorMessage += "위치 요청 시간이 초과되었습니다.";
                            break;
                        case error.UNKNOWN_ERROR:
                            errorMessage += "알 수 없는 오류가 발생했습니다.";
                            break;
                    }
                    
                    locationStatus.textContent = errorMessage;
                    
                    // 위치 정보를 가져올 수 없는 경우 기본 위치 사용 (서울시청)
                    userLocation = {
                        lat: 37.566826,
                        lng: 126.9786567
                    };
                    
                    locationStatus.textContent += " 기본 위치(서울시청)를 사용합니다.";
                    
                    // 기본 위치로 지도 중심 설정
                    map.setCenter(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
                    map.setLevel(5);  // 더 넓은 영역 표시
                    
                    // IP 기반 위치 정보 시도
                    getIpBasedLocation();
                },
                options
            );
        } else {
            locationStatus.textContent = "이 브라우저에서는 위치 서비스를 지원하지 않습니다.";
            
            // 위치 서비스를 지원하지 않는 경우 기본 위치 사용
            userLocation = {
                lat: 37.566826,
                lng: 126.9786567
            };
            
            locationStatus.textContent += " 기본 위치(서울시청)를 사용합니다.";
            map.setCenter(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
            
            // IP 기반 위치 정보 시도
            getIpBasedLocation();
        }
    }
    
    // IP 기반 위치 정보 가져오기
    function getIpBasedLocation() {
        fetch('/api/ip-location')
            .then(response => response.json())
            .then(data => {
                if (data.lat && data.lng) {
                    // IP 기반 위치 설정
                    userLocation = {
                        lat: data.lat,
                        lng: data.lng
                    };
                    
                    locationStatus.textContent = `IP 기반 위치 정보를 사용합니다: ${data.city}, ${data.region}`;
                    
                    // 지도 중심 위치 변경
                    map.setCenter(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
                    map.setLevel(5);  // 넓은 영역 표시 (IP 기반 위치는 정확도가 낮음)
                    
                    // 마커 표시
                    const userMarker = new kakao.maps.Marker({
                        position: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
                        map: map
                    });
                    
                    markers.push(userMarker);
                    
                    // IP 기반 정확도가 낮으므로 1km 반경 원 표시
                    const circle = new kakao.maps.Circle({
                        center: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
                        radius: 1000,  // 1km
                        strokeWeight: 1,
                        strokeColor: '#ffa500',
                        strokeOpacity: 0.7,
                        fillColor: '#ffa500',
                        fillOpacity: 0.2
                    });
                    
                    circle.setMap(map);
                } else {
                    locationStatus.textContent = "IP 기반 위치 정보를 가져올 수 없습니다.";
                }
            })
            .catch(error => {
                console.error("IP 위치 정보 오류:", error);
                locationStatus.textContent = "IP 기반 위치 정보를 가져올 수 없습니다.";
            });
    }
    
    // 위치 정확도 진단 함수
    function diagnoseLocationAccuracy() {
        locationStatus.textContent = "위치 정확도 진단 중...";
        
        // 브라우저 정보 확인
        const browserInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            geolocationSupported: 'geolocation' in navigator
        };
        
        console.log("브라우저 정보:", browserInfo);
        
        // 위치 정보 권한 확인
        navigator.permissions.query({name: 'geolocation'}).then(function(result) {
            console.log("위치 정보 권한 상태:", result.state);
            
            if (result.state === 'denied') {
                locationStatus.textContent = "위치 정보 접근이 차단되어 있습니다. 브라우저 설정에서 위치 접근 권한을 허용해주세요.";
            } else if (result.state === 'prompt') {
                locationStatus.textContent = "위치 정보 접근 권한을 요청합니다. 허용을 눌러주세요.";
            }
        });
        
        // GPS 위치 정보 시도
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    console.log("위치 정보:", position);
                    console.log("정확도:", position.coords.accuracy, "미터");
                    
                    // 정확도 평가
                    let accuracyMessage = "";
                    if (position.coords.accuracy < 100) {
                        accuracyMessage = "매우 좋음";
                    } else if (position.coords.accuracy < 500) {
                        accuracyMessage = "양호";
                    } else if (position.coords.accuracy < 1000) {
                        accuracyMessage = "보통";
                    } else {
                        accuracyMessage = "낮음";
                    }
                    
                    locationStatus.textContent = `위치 정보 정확도: ${Math.round(position.coords.accuracy)}m (${accuracyMessage})`;
                    
                    // 추가 정보 콘솔에 출력
                    if (position.coords.altitude !== null) {
                        console.log("고도:", position.coords.altitude, "미터");
                    }
                    if (position.coords.speed !== null) {
                        console.log("속도:", position.coords.speed, "m/s");
                    }
                },
                function(error) {
                    console.error("위치 정보 오류:", error);
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            locationStatus.textContent = "위치 정보 접근이 거부되었습니다. 브라우저 설정을 확인해주세요.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            locationStatus.textContent = "위치 정보를 사용할 수 없습니다. Wi-Fi나 GPS가 켜져 있는지 확인하세요.";
                            break;
                        case error.TIMEOUT:
                            locationStatus.textContent = "위치 요청 시간이 초과되었습니다. 네트워크 연결 상태를 확인하세요.";
                            break;
                        case error.UNKNOWN_ERROR:
                            locationStatus.textContent = "알 수 없는 오류가 발생했습니다.";
                            break;
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        } else {
            locationStatus.textContent = "이 브라우저에서는 위치 서비스를 지원하지 않습니다.";
        }
    }
    
    // 주변 병원 검색 함수
    function getNearbyHospitals() {
        if (!userLocation) {
            getUserLocation();
            locationStatus.textContent = "위치 정보를 가져오는 중입니다. 잠시 기다려주세요.";
            return;
        }
        
        // 모든 마커 제거
        removeAllMarkers();
        
        // 사용자 위치 기반 카테고리 검색 (병원만)
        ps.categorySearch(HOSPITAL_CATEGORY_GROUP_CODE, function(data, status, pagination) {
            if (status === kakao.maps.services.Status.OK) {
                // 검색 결과에 거리 정보 추가
                const placesWithDistance = data.map(place => {
                    const distance = getDistance(
                        userLocation.lat, userLocation.lng,
                        parseFloat(place.y), parseFloat(place.x)
                    );
                    
                    return {
                        ...place,
                        distance: distance
                    };
                });
                
                // 거리순으로 정렬
                placesWithDistance.sort((a, b) => a.distance - b.distance);
                
                // 검색된 장소 위치를 기준으로 지도 범위 재설정
                const bounds = new kakao.maps.LatLngBounds();
                bounds.extend(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
                
                // 검색 결과 목록 표시 및 마커 표시
                displayPlacesWithDistance(placesWithDistance);
                
                for (let i = 0; i < Math.min(placesWithDistance.length, 10); i++) {
                    bounds.extend(new kakao.maps.LatLng(placesWithDistance[i].y, placesWithDistance[i].x));
                }
                
                // 검색된 장소들과 사용자 위치가 모두 보이게 지도 범위 설정
                map.setBounds(bounds);
                
                locationStatus.textContent = `내 주변 병원을 찾았습니다. 총 ${placesWithDistance.length}개의 결과.`;
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                locationStatus.textContent = "주변에 병원이 없습니다.";
                hospitalResults.innerHTML = "<p>검색 결과가 없습니다.</p>";
                return;
            } else if (status === kakao.maps.services.Status.ERROR) {
                locationStatus.textContent = "검색 중 오류가 발생했습니다.";
                return;
            }
        }, {
            location: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: 5000,  // 5km 반경 내 검색
            sort: kakao.maps.services.SortBy.DISTANCE  // 거리순 정렬
        });
    }
    
    // 병원 검색 함수
    function searchHospitals() {
        const keyword = hospitalSearch.value.trim();
        if (keyword === "") return;
        
        // 모든 마커 제거
        removeAllMarkers();
        
        // 검색 옵션
        const searchOption = userLocation ? {
            location: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: 10000,  // 10km 반경 내 검색
            sort: kakao.maps.services.SortBy.DISTANCE  // 거리순 정렬
        } : {};
        
        // 방법 1: 키워드 + 카테고리 검색 (키워드가 있는 경우)
        if (keyword) {
            // 키워드가 있는 경우: 키워드 + 카테고리 필터링 방식
            ps.keywordSearch(keyword, function(data, status, pagination) {
                if (status === kakao.maps.services.Status.OK) {
                    // 병원 관련 카테고리 필터링
                    const hospitalPlaces = data.filter(place => {
                        // 카테고리 확인
                        const categoryName = place.category_name || "";
                        const categoryGroupCode = place.category_group_code || "";
                        
                        // 병원/약국 카테고리 코드가 있거나, 카테고리 이름에 '병원', '의원', '클리닉', '약국' 포함
                        return categoryGroupCode === HOSPITAL_CATEGORY_GROUP_CODE ||
                               categoryGroupCode === PHARMACY_CATEGORY_GROUP_CODE ||
                               categoryName.includes('병원') ||
                               categoryName.includes('의원') ||
                               categoryName.includes('클리닉') ||
                               categoryName.includes('의료') ||
                               categoryName.includes('보건소');
                    });
                    
                    // 병원 검색 결과가 없는 경우, 키워드에 '병원' 추가해서 재검색
                    if (hospitalPlaces.length === 0 && !keyword.includes('병원')) {
                        ps.keywordSearch(keyword + ' 병원', function(hospitalData, hospitalStatus) {
                            processSearchResults(hospitalData, hospitalStatus, pagination, userLocation);
                        }, searchOption);
                    } else {
                        // 필터링된 병원 결과 표시
                        processSearchResults(hospitalPlaces, status, pagination, userLocation);
                    }
                } else {
                    processSearchResults(data, status, pagination, userLocation);
                }
            }, searchOption);
        } else {
            // 키워드가 없는 경우: 카테고리 검색만 수행
            ps.categorySearch(HOSPITAL_CATEGORY_GROUP_CODE, function(data, status, pagination) {
                processSearchResults(data, status, pagination, userLocation);
            }, searchOption);
        }
    }
    
    // 검색 결과 처리 함수
    function processSearchResults(data, status, pagination, userLocation) {
        if (status === kakao.maps.services.Status.OK) {
            // 사용자 위치가 있으면 거리 정보 추가
            if (userLocation) {
                data = data.map(place => {
                    const distance = getDistance(
                        userLocation.lat, userLocation.lng,
                        parseFloat(place.y), parseFloat(place.x)
                    );
                    
                    return {
                        ...place,
                        distance: distance
                    };
                });
                
                // 거리순으로 정렬
                data.sort((a, b) => a.distance - b.distance);
            }
            
            // 검색된 장소 위치를 기준으로 지도 범위 재설정
            const bounds = new kakao.maps.LatLngBounds();
            
            // 검색 결과 목록 표시 및 마커 표시
            if (userLocation) {
                displayPlacesWithDistance(data);
                
                // 사용자 위치도 경계에 포함
                bounds.extend(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
            } else {
                displayPlaces(data);
            }
            
            for (let i = 0; i < data.length; i++) {
                bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
            }
            
            // 검색된 장소들이 모두 보이게 지도 범위 설정
            map.setBounds(bounds);
            
            locationStatus.textContent = `검색 완료. 총 ${data.length}개의 결과.`;
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            locationStatus.textContent = "검색 결과가 존재하지 않습니다.";
            hospitalResults.innerHTML = "<p>검색 결과가 없습니다.</p>";
            return;
        } else if (status === kakao.maps.services.Status.ERROR) {
            locationStatus.textContent = "검색 중 오류가 발생했습니다.";
            return;
        }
    }
    
    // 검색 결과 표시 함수 (거리 정보 포함)
    function displayPlacesWithDistance(places) {
        // 지도에 표시되고 있는 마커 제거
        removeAllMarkers();
        
        // 병원 목록 초기화
        removeAllChildNodes(hospitalResults);
        
        // 병원 정보 초기화
        hospitalInfo.innerHTML = "<h3>병원 정보</h3><p>병원을 선택하여 정보를 확인하세요.</p>";
        
        // 결과가 없는 경우
        if (places.length === 0) {
            const noResult = document.createElement('p');
            noResult.textContent = '검색 결과가 없습니다.';
            hospitalResults.appendChild(noResult);
            return;
        }
        
        // 마커와 목록 생성
        for (let i = 0; i < places.length; i++) {
            // 마커 생성 및 설정
            const marker = addMarker(new kakao.maps.LatLng(places[i].y, places[i].x), i);
            markers.push(marker);
            
            // 결과 목록 아이템 생성
            const itemEl = document.createElement('div');
            itemEl.className = 'hospital-item';
            itemEl.innerHTML = `
                <h4>${places[i].place_name}</h4>
                <p>${places[i].address_name}</p>
                <p>${places[i].phone || '전화번호 정보 없음'}</p>
                <p class="distance">${formatDistance(places[i].distance)}</p>
                <p class="category">${places[i].category_name}</p>
            `;
            
            // 아이템 클릭 이벤트 등록
            (function(marker, place) {
                itemEl.onclick = function() {
                    displayPlaceInfo(place);
                    displayInfowindow(marker, place);
                    
                    // 지도 중심 이동
                    map.setCenter(new kakao.maps.LatLng(place.y, place.x));
                };
            })(marker, places[i]);
            
            hospitalResults.appendChild(itemEl);
            
            // 마커 이벤트 등록
            (function(marker, place) {
                kakao.maps.event.addListener(marker, 'click', function() {
                    displayPlaceInfo(place);
                    displayInfowindow(marker, place);
                });
            })(marker, places[i]);
        }
    }
    
    // 검색 결과 표시 함수 (거리 정보 없음)
    function displayPlaces(places) {
        // 지도에 표시되고 있는 마커 제거
        removeAllMarkers();
        
        // 병원 목록 초기화
        removeAllChildNodes(hospitalResults);
        
        // 병원 정보 초기화
        hospitalInfo.innerHTML = "<h3>병원 정보</h3><p>병원을 선택하여 정보를 확인하세요.</p>";
        
        // 결과가 없는 경우
        if (places.length === 0) {
            const noResult = document.createElement('p');
            noResult.textContent = '검색 결과가 없습니다.';
            hospitalResults.appendChild(noResult);
            return;
        }
        
        // 마커와 목록 생성
        for (let i = 0; i < places.length; i++) {
            // 마커 생성 및 설정
            const marker = addMarker(new kakao.maps.LatLng(places[i].y, places[i].x), i);
            markers.push(marker);
            
            // 결과 목록 아이템 생성
            const itemEl = document.createElement('div');
            itemEl.className = 'hospital-item';
            itemEl.innerHTML = `
                <h4>${places[i].place_name}</h4>
                <p>${places[i].address_name}</p>
                <p>${places[i].phone || '전화번호 정보 없음'}</p>
                <p class="category">${places[i].category_name}</p>
            `;
            
            // 아이템 클릭 이벤트 등록
            (function(marker, place) {
                itemEl.onclick = function() {
                    displayPlaceInfo(place);
                    displayInfowindow(marker, place);
                    
                    // 지도 중심 이동
                    map.setCenter(new kakao.maps.LatLng(place.y, place.x));
                };
            })(marker, places[i]);
            
            hospitalResults.appendChild(itemEl);
            
            // 마커 이벤트 등록
            (function(marker, place) {
                kakao.maps.event.addListener(marker, 'click', function() {
                    displayPlaceInfo(place);
                    displayInfowindow(marker, place);
                });
            })(marker, places[i]);
        }
    }
    
    // 병원 상세 정보 표시
    function displayPlaceInfo(place) {
        let content = `
            <h3>${place.place_name}</h3>
            <p><strong>주소:</strong> ${place.address_name}</p>
            <p><strong>전화:</strong> ${place.phone || '정보 없음'}</p>
            <p><strong>카테고리:</strong> ${place.category_name}</p>
        `;
        
        if (place.distance) {
            content += `<p><strong>거리:</strong> ${formatDistance(place.distance)}</p>`;
        }
        
        hospitalInfo.innerHTML = content;
        // 운영 시간 API 호출 (서버측 구현 필요)
        getHospitalHours(place.id);
    }
    
    // 마커 생성 함수
    function addMarker(position, idx) {
        const marker = new kakao.maps.Marker({
            position: position,
            map: map
        });
        
        return marker;
    }
    
    // 모든 마커 제거 함수
    function removeAllMarkers() {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    }
    
    // 인포윈도우 표시 함수
    function displayInfowindow(marker, place) {
        let content = `
            <div class="info-window">
                <h4>${place.place_name}</h4>
                <p>${place.address_name}</p>
                <p>${place.phone || '전화번호 정보 없음'}</p>
            `;
        
        if (place.distance) {
            content += `<p>거리: ${formatDistance(place.distance)}</p>`;
        }
        
        content += `
                <p>${place.category_name}</p>
            </div>
        `;
        
        infowindow.setContent(content);
        infowindow.open(map, marker);
    }
    
    // 모든 자식 노드 제거 함수
    function removeAllChildNodes(el) {
        while (el.hasChildNodes()) {
            el.removeChild(el.lastChild);
        }
    }
    
    // 두 위치 사이의 거리 계산 함수 (Haversine 공식)
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 지구 반경 (km)
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c * 1000; // 미터 단위로 변환
        return distance;
    }
    
    // 각도를 라디안으로 변환
    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    // 거리 포맷팅 함수
    function formatDistance(distance) {
        if (distance < 1000) {
            return Math.round(distance) + 'm';
        } else {
            return (distance / 1000).toFixed(1) + 'km';
        }
    }
    
    // 서버에서 병원 운영 시간 가져오기 (서버 API 구현 필요)
    function getHospitalHours(placeId) {
        fetch(`/api/hospital-hours?id=${placeId}`)
            .then(response => response.json())
            .then(data => {
                // 운영 시간 표시 로직 추가
                const hoursHTML = `
                    <div class="hospital-hours">
                        <h4>운영 시간</h4>
                        <p>월요일: ${data.monday}</p>
                        <p>화요일: ${data.tuesday}</p>
                        <p>수요일: ${data.wednesday}</p>
                        <p>목요일: ${data.thursday}</p>
                        <p>금요일: ${data.friday}</p>
                        <p>토요일: ${data.saturday}</p>
                        <p>일요일: ${data.sunday}</p>
                    </div>
                `;
                
                // 병원 정보에 운영 시간 추가
                hospitalInfo.innerHTML += hoursHTML;
            })
            .catch(error => {
                console.error("Error:", error);
            });
    }
    
    // 진단 버튼 추가
    const diagButton = document.createElement('button');
    diagButton.textContent = '위치 정확도 진단';
    diagButton.className = 'location-btn';
    diagButton.onclick = diagnoseLocationAccuracy;
    
    // 페이지 로드 후 버튼 추가
    setTimeout(() => {
        if (document.querySelector('.location-controls')) {
            document.querySelector('.location-controls').appendChild(diagButton);
        }
    }, 1000);
});