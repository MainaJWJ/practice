// Webamp 관리자 클래스
class WebampManager {
    constructor() {
        this.webampInstance = null;
        this.webampContainer = null;
        this.webampTab = null;
        this.highestZIndex = 1000;
    }

    // Webamp 창 생성 및 실행
    createWebampWindow() {
        // 이미 Webamp 창이 열려있으면 포커스만
        if (this.webampInstance && document.body.contains(this.webampContainer)) {
            this.webampContainer.style.zIndex = ++this.highestZIndex;
            return;
        }

        // Webamp 컨테이너 가져오기
        this.webampContainer = document.getElementById('webamp-container');
        
        // 작업표시줄에 Webamp 탭 생성
        this.createTaskbarTab();
        
        // Webamp 컨테이너 스타일 초기화
        this.webampContainer.style.display = '';
        this.webampContainer.style.zIndex = ++this.highestZIndex;
        
        // Webamp 인스턴스 생성 및 렌더링
        this.createWebampInstance();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // Webamp 실행 시 탭 활성화
        this.webampTab.classList.add('active');
    }

    // 작업표시줄 탭 생성
    createTaskbarTab() {
        const taskbarWindows = document.querySelector('.taskbar-windows');
        this.webampTab = document.createElement('button');
        this.webampTab.className = 'taskbar-tab';
        this.webampTab.innerHTML = '<img src="./image/mediaplayer.png" class="taskbar-tab-icon"><span>Webamp</span>';
        taskbarWindows.appendChild(this.webampTab);
    }

    // Webamp 인스턴스 생성
    createWebampInstance() {
        const tracks = [
            {
                metaData: { 
                    artist: "Wolfgang Amadeus Mozart", 
                    title: "Turkish March (Rondo alla Turca)" 
                },
                url: "./webamp/Turkish March.mp3"
            },
            {
                metaData: { 
                    artist: "Johann Pachelbel", 
                    title: "Canon in D Major" 
                },
                url: "./webamp/canon.mp3"
            }
        ];
        
        console.log('Webamp tracks:', tracks);
        
        this.webampInstance = new window.Webamp({
            initialTracks: tracks
        });
        
        this.webampInstance.renderWhenReady(this.webampContainer).then(() => {
            console.log('Webamp rendered successfully');
        }).catch(error => {
            console.error('Webamp render error:', error);
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 탭 클릭 시 show/hide 및 z-index 조정
        this.webampTab.addEventListener('click', () => {
            this.handleTabClick();
        });

        // Webamp 컨테이너 클릭 시 항상 최상위로
        this.webampContainer.addEventListener('mousedown', () => {
            this.bringToFront();
        });

        // Webamp 닫힐 때 탭 제거
        this.webampInstance.onClose(() => {
            this.cleanup();
        });
    }

    // 탭 클릭 처리
    handleTabClick() {
        const isHidden = this.webampContainer.style.display === 'none';
        const currentZ = parseInt(this.webampContainer.style.zIndex) || 0;
        
        if (isHidden) {
            // 복원 + 최상위
            this.webampContainer.style.display = '';
            this.webampContainer.style.zIndex = ++this.highestZIndex;
            this.webampTab.classList.add('active');
        } else if (currentZ === this.highestZIndex) {
            // 이미 최상위면 최소화
            this.webampContainer.style.display = 'none';
            this.webampTab.classList.remove('active');
        } else {
            // 보이지만 최상위가 아니면 z-index만 올림
            this.webampContainer.style.zIndex = ++this.highestZIndex;
            this.webampTab.classList.add('active');
        }
    }

    // 최상위로 올리기
    bringToFront() {
        if (this.webampContainer.style.display !== 'none') {
            this.webampContainer.style.zIndex = ++this.highestZIndex;
            this.webampTab.classList.add('active');
        }
    }

    // 정리 작업
    cleanup() {
        this.webampInstance = null;
        this.webampContainer.innerHTML = '';
        if (this.webampTab) {
            this.webampTab.remove();
            this.webampTab = null;
        }
    }

    // z-index 업데이트 (외부에서 호출)
    updateZIndex(newHighestZIndex) {
        this.highestZIndex = newHighestZIndex;
    }

    // z-index 증가 및 반환 (외부에서 호출)
    incrementZIndex() {
        return ++this.highestZIndex;
    }
}

// 전역 Webamp 매니저 인스턴스
window.webampManager = new WebampManager();

// Webamp 아이콘 더블클릭 이벤트 설정 함수
function setupWebampIcon() {
    setTimeout(() => {
        const webampIcon = document.getElementById('webamp-icon');
        if (webampIcon) {
            let clickTimer = null;
            webampIcon.addEventListener('click', function(e) {
                e.preventDefault();
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    if (window.webampManager.webampInstance) return;
                    
                    // z-index 동기화 (전역 변수가 있는 경우)
                    if (typeof window.highestZIndex !== 'undefined') {
                        window.webampManager.updateZIndex(window.highestZIndex);
                    }
                    
                    // Webamp 창 생성
                    window.webampManager.createWebampWindow();
                } else {
                    clickTimer = setTimeout(() => { clickTimer = null; }, 200);
                }
            });
        }
    }, 100);
}

// 페이지 로드 시 Webamp 아이콘 설정
document.addEventListener('DOMContentLoaded', function() {
    setupWebampIcon();
}); 