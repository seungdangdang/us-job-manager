# Job 관리 백엔드 시스템 (NestJS)

NestJS 기반의 작업(Job) 관리 시스템입니다. <br>

1. 작업 생성 및 조회 API
2. 주기적으로 상태를 변경하는 배치 스케줄러 (pending -> completed)
3. 파일 기반 JSON 데이터베이스(`node-json-db`) 사용
4. API 유효성 검증 및 예외처리 적용

## 1. 프로젝트 실행 방법
```bash
npm install
npm run start
```
- 서버 주소 (http://localhost:3000)

<br>

## 2. API 사용법
### 2-1. 모든 작업 목록 조회
[Postman Link - 모든 작업 목록 조회](https://www.postman.com/maintenance-saganist-54947573/us-subject/request/74ipvdd/?tab=overview)

- Method: GET `/jobs`
- Response
    ```
    [
        {
            "id": "ed7fc939-cb82-477e-9211-6c59c0b11a9a",
            "title": "TEST-1",
            "description": "test 1",
            "status": "completed"
        },
        {...}
    ]
    ```

<br>

### 2-2. 특정 작업 상세 정보 조회
[Postman Link - 특정 작업 상세 정보 조회](https://www.postman.com/maintenance-saganist-54947573/us-subject/request/fnb108u/?tab=overview)

- Method: GET `/jobs/:id`
- Response
    ```
    {
        "id": "1ee36747-a044-4f6c-818d-fde88dd45e56",
        "title": "TEST-3",
        "description": "test 3",
        "status": "completed"
    }
    ```

<br>

### 2-3. 작업 조건 검색
[Postman Link - 작업 조건 검색](https://www.postman.com/maintenance-saganist-54947573/us-subject/request/eciw3ak/)

- Method: GET `/jobs/search`
- Params: title (string), status (string)
- Response
    ```
    [
        {
            "id": "ed7fc939-cb82-477e-9211-6c59c0b11a9a",
            "title": "TEST-1",
            "description": "test 1",
            "status": "completed"
        },
        {...}
    ]
    ```

<br>

### 2-4. 작업 생성 요청
[Postman Link - 작업 생성 요청](https://www.postman.com/maintenance-saganist-54947573/us-subject/request/83v27y3/)
- Method: POST `/jobs`

- Request Body
    ```
    {
      "title": "TEST-3",
      "description": "test 3"
    }
    ```
- Response
    ```
    {
        "id": "1ee36747-a044-4f6c-818d-fde88dd45e56",
        "title": "TEST-3",
        "description": "test 3",
        "status": "pending"
    }
    ```

<br>

## 3. 구현 관련 상세 설명 및 코멘트
### 3-1. API 설계 및 처리 전략
1. 컨트롤러-서비스-DTO-엔티티로 계층 분리
2. 요청 유효성 검증 (class-validator + ValidationPipe)

### 3-2. 데이터 처리 전략
1. node-json-db를 통해 파일 기반의 데이터 저장 처리
2. 작업 데이터는 jobs.json에 Record<string, Job> 형태로 저장
3. 각 작업은 UUID 기반 고유 ID를 사용

### 3-3. 성능 및 스케줄링 전략
1. @nestjs/schedule 기반 크론 배치 구현
2. 매 1분마다 상태가 pending인 작업을 자동으로 completed로 전환
3. 상태 변경 내역은 logs/logs.txt에 자동 기록 (파일 기반 로그)

### 3-4. 기타 구현 디테일
1. 도메인 단위로 controller/, dto/, entites/, service/ 디렉토리를 분리해 책임 명확화
2. 전역 설정(app.module.ts, main.ts)은 core/ 디렉토리에서 일괄 관리
3. 테스트 코드는 test/ 디렉토리에서 통합 관리
4. 파일 경로는 process.cwd() + path.join() 방식으로 절대경로 안전성 확보
5. 작업 생성 / 업데이트 시 동시성 고려 (write queue로 비동기 write)
6. 동시성 테스트 코드 작성

<br>

## 4. 필수 요구사항 체크리스트
✅ jobs.json에 초기 샘플 데이터 세팅 완료</br>
✅ Node.js 기본 환경에서 실행 가능하도록 구성

<br>

## 5. 미구현 사항
1. status는 현재 문자열(pending, completed)로 관리 중 <br>
   - 실무에서는 enum 또는 숫자 타입(0, 1) 기반 상태 코드 관리가 일반적이나,
     과제 요구사항에서 문자열로 명시되어 있어 이에 맞춰 구현하였음
   - 명확한 상태 코드 체계 및 status enum 정의는 향후 확장 시 고려 가능
2. 조회 성능 최적화 구조 변경 미적용
   - node-json-db는 데이터를 메모리에 로딩해 처리하므로, 캐시를 추가하더라도 성능 향상 폭이 크지 않음
   - 실제 10만 건 기준 캐시 적용 전후 조회 속도 차이는 약 5% 내외로, 구조 복잡도 대비 효과가 미비하여 구조 변경은 보류함