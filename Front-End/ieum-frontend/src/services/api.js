// src/services/api.js
import axios from 'axios';

// API 기본 설정
const API_BASE = 'http://127.0.0.1:8000/api';

// axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 10000, // 10초 타임아웃
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 (로딩 상태 등에 활용 가능)
apiClient.interceptors.request.use(
    (config) => {
        console.log('API 요청:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
    (response) => {
        console.log('API 응답 성공:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('API 응답 에러:', error.response?.status, error.config?.url);
        return Promise.reject(error);
    }
);

// === API 함수들 ===

export const searchAPI = {
    // 종합 검색 (요약 페이지용)
    comprehensive: async (query, regionCode = "44790") => {
        try {
            const response = await apiClient.post('/search/comprehensive', {
                query,
                region_code: regionCode
            });
            return response.data;
        } catch (error) {
            throw new Error(`종합 검색 실패: ${error.response?.data?.detail || error.message}`);
        }
    },

    // 일자리 검색 (일자리 탭용)
    jobs: async (regionCode, filters = {}) => {
        try {
            const response = await apiClient.post('/search/jobs', {
                region_code: regionCode,
                ...filters
            });
            return response.data;
        } catch (error) {
            throw new Error(`일자리 검색 실패: ${error.response?.data?.detail || error.message}`);
        }
    },

    // 부동산 검색 (부동산 탭용)
    realestate: async (regionCode, dealYmd = "202506") => {
        try {
            const response = await apiClient.post('/search/realestate', {
                region_code: regionCode,
                deal_ymd: dealYmd
            });
            return response.data;
        } catch (error) {
            throw new Error(`부동산 검색 실패: ${error.response?.data?.detail || error.message}`);
        }
    },

    // 정책 검색 (정책 탭용)
    policies: async (regionCode, keywords = null) => {
        try {
            const response = await apiClient.post('/search/policies', {
                region_code: regionCode,
                keywords
            });
            return response.data;
        } catch (error) {
            throw new Error(`정책 검색 실패: ${error.response?.data?.detail || error.message}`);
        }
    }
};

// 메타데이터 API
export const metaAPI = {
    // 서버 상태 확인
    health: async () => {
        try {
            const response = await apiClient.get('/health');
            return response.data;
        } catch (error) {
            throw new Error(`서버 상태 확인 실패: ${error.message}`);
        }
    },

    // 지원 지역 목록
    regions: async () => {
        try {
            const response = await apiClient.get('/regions');
            return response.data;
        } catch (error) {
            throw new Error(`지역 목록 조회 실패: ${error.message}`);
        }
    },

    // 직무분야 목록
    jobFields: async () => {
        try {
            const response = await apiClient.get('/job-fields');
            return response.data;
        } catch (error) {
            throw new Error(`직무분야 목록 조회 실패: ${error.message}`);
        }
    }
};

export default apiClient;