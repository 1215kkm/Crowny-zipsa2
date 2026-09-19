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

## 최초 왕관 비교본
첨부한 원본의 왕관 포함 이미지를 사용합니다. 두 버전의 앱 레이아웃과 이전·다음 이동은 같습니다. 원본 왕관은 본체에 포함되어 있어 이 비교본에서는 왕관만 독립적으로 떨어지는 효과를 적용하지 않습니다.


## Codrops RainEffect integration
Login background now uses the adapted Codrops normal-map/refraction renderer with existing CROWNY droplet motion and touch wiping. WebGL unavailable: previous Canvas sprite renderer remains. Four weather preview modes are manual, not live weather data. Future provider calls window.CrownyWeather.set(mode). No location is collected. UI refraction snapshot stays in memory and excludes inputs and the character. Open login-preview.html for the embedded offline preview; index.html includes the full app. Third-party notices must travel with this package.
