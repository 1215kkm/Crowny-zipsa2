# CROWNY 집사 브랜드 UI

`index.html`을 열면 스플래시부터 로그인, 집사 홈, 작업, 상태, 대화 관리, 협업, 기계간 요청, 채팅까지 확인할 수 있습니다.

## 파일

- `index.html`: 화면 구조와 시안용 이동
- `brand-system.css`: CROWNY 공통 색상·간격·타입·컴포넌트 규칙
- `crowny-character.js`: 물방울 캐릭터, 올바른 왕관, 표정, 물결, 터치 반응
- `assets/crowny-water-body.png`: 왕관을 분리한 투명 물방울 본체
- `butler-motions-v3.html`: 왕관을 수정한 18가지 모션 샘플

## 캐릭터 상호작용

- 누르기: 놀라는 표정, 몸이 튀고 왕관이 위로 벗겨졌다가 내려앉음
- 누른 채 움직이기: 손가락을 따라 시선과 몸 방향 이동
- 놓기: 잔잔하게 흔들린 뒤 원래 동작으로 복귀
- 경고 반응: 왕관이 옆으로 떨어졌다가 다시 머리에 얹힘
- 스플래시: 물결이 반복해서 퍼지고 캐릭터가 호흡하듯 움직임
- `prefers-reduced-motion`: 움직임 최소화

## 앱 연결 기준

색상과 간격은 `brand-system.css`의 `:root` 변수로 관리합니다. 캐릭터 상태는 `rest`, `greet`, `listen`, `work`, `search`, `message`, `success`, `warn`, `sleep`, `sync`를 사용합니다.

```js
CrownyCharacters.setState('character-id', 'work');
```

스플래시 자동 전환은 `index.html`의 `AUTO_ADVANCE_SPLASH` 값으로 바꿀 수 있습니다.
