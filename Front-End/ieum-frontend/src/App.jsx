// src/App.jsx - 결과 확인 로직 수정 버전
import React, { useState } from "react";
import MainPage from "./components/MainPage";
import ResultsPage from "./components/ResultsPage";
import LoadingPage from "./components/LoadingPage";
import { searchAPI } from "./services/api";

function App() {
  const [currentPage, setCurrentPage] = useState("main");
  const [searchData, setSearchData] = useState(null);
  const [error, setError] = useState(null);

  const [loadingStatus, setLoadingStatus] = useState({
    summary: { loading: false, completed: false, error: null },
    jobs: { loading: false, completed: false, error: null },
    realestate: { loading: false, completed: false, error: null },
    policies: { loading: false, completed: false, error: null },
  });

  const [resultData, setResultData] = useState({
    summary: null,
    jobs: null,
    realestate: null,
    policies: null,
  });

  // 지역 분석 함수
  const analyzePromptForRegion = (prompt) => {
    const regionMapping = {
      정선군: "51770",
      정선: "51770",
      영월군: "51750",
      영월: "51750",
      청양군: "44790",
      청양: "44790",
      강릉시: "51150",
      강릉: "51150",
      김제시: "52210",
      김제: "52210",
    };

    const text = prompt.toLowerCase().replace(/\s/g, "");
    const sortedKeys = Object.keys(regionMapping).sort(
      (a, b) => b.length - a.length
    );

    for (const regionName of sortedKeys) {
      if (text.includes(regionName.toLowerCase())) {
        console.log(
          `🎯 지역 매칭 성공: "${regionName}" -> ${regionMapping[regionName]}`
        );
        return regionMapping[regionName];
      }
    }

    console.log("🎯 기본 지역 적용: 청양군 (44790)");
    return "44790";
  };

  // 입력 검증 함수
  const validateInput = (prompt) => {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      throw new Error("검색할 내용을 입력해주세요.");
    }

    if (cleanPrompt.length < 2) {
      throw new Error("검색어는 최소 2글자 이상 입력해주세요.");
    }

    if (cleanPrompt.length > 500) {
      throw new Error("검색어는 최대 500자까지 입력 가능합니다.");
    }

    const sanitizedPrompt = cleanPrompt
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");

    if (sanitizedPrompt !== cleanPrompt) {
      console.warn("⚠️ 입력에서 위험한 스크립트가 제거되었습니다.");
    }

    return sanitizedPrompt;
  };

  // 🎯 개별 API 상태 업데이트 함수
  const updateApiStatus = (apiName, status) => {
    setLoadingStatus((prev) => ({
      ...prev,
      [apiName]: status,
    }));
  };

  // 🎯 개별 API 결과 저장 함수
  const updateApiResult = (apiName, data) => {
    setResultData((prev) => ({
      ...prev,
      [apiName]: data,
    }));
  };

  // 검색 실행 함수
  const handleSearch = async (prompt) => {
    try {
      const validatedPrompt = validateInput(prompt);
      const regionCode = analyzePromptForRegion(validatedPrompt);

      console.log(`🚀 검색 시작: "${validatedPrompt}" -> 지역: ${regionCode}`);

      setCurrentPage("loading");
      setError(null);

      const newSearchData = {
        prompt: validatedPrompt,
        regionCode,
      };
      setSearchData(newSearchData);

      // 초기 상태 설정
      const initialLoadingStatus = {
        summary: { loading: false, completed: false, error: null },
        jobs: { loading: false, completed: false, error: null },
        realestate: { loading: false, completed: false, error: null },
        policies: { loading: false, completed: false, error: null },
      };
      setLoadingStatus(initialLoadingStatus);
      setResultData({
        summary: null,
        jobs: null,
        realestate: null,
        policies: null,
      });

      // 🚀 개별 추적이 가능한 병렬 API 호출
      await loadAllAPIDataWithIndividualTracking(validatedPrompt, regionCode);
    } catch (err) {
      console.error("❌ 검색 실행 오류:", err);
      setError(err.message);
      setCurrentPage("main");
    }
  };

  // 🚀 개별 추적 가능한 병렬 API 호출
  const loadAllAPIDataWithIndividualTracking = async (prompt, regionCode) => {
    // 🎯 결과를 추적할 임시 객체
    const tempResults = {
      summary: null,
      jobs: null,
      realestate: null,
      policies: null,
    };

    // 🎯 각 API별로 개별 Promise 생성
    const apiCalls = [
      {
        name: "summary",
        promise: handleIndividualAPI(
          "summary",
          () => searchAPI.comprehensive(prompt, regionCode),
          tempResults
        ),
      },
      {
        name: "jobs",
        promise: handleIndividualAPI(
          "jobs",
          () => searchAPI.jobs(regionCode),
          tempResults
        ),
      },
      {
        name: "realestate",
        promise: handleIndividualAPI(
          "realestate",
          () => searchAPI.realestate(regionCode),
          tempResults
        ),
      },
      {
        name: "policies",
        promise: handleIndividualAPI(
          "policies",
          () => searchAPI.policies(regionCode),
          tempResults
        ),
      },
    ];

    // 🎯 모든 API를 병렬로 시작
    apiCalls.forEach(({ name }) => {
      updateApiStatus(name, { loading: true, completed: false, error: null });
    });

    // 🎯 모든 API 완료 대기
    const results = await Promise.allSettled(
      apiCalls.map((api) => api.promise)
    );

    // 🎯 성공한 API 개수 확인 (tempResults 기준)
    const successfulResults = Object.values(tempResults).filter(
      (data) => data !== null
    );
    const hasAnySuccess = successfulResults.length > 0;

    console.log(
      `📊 API 결과 요약: 성공 ${successfulResults.length}개, 전체 ${
        Object.keys(tempResults).length
      }개`
    );
    console.log("📋 상세 결과:", tempResults);

    // 🎯 모든 API 완료 후 결과 페이지로 이동
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (hasAnySuccess) {
      console.log("✅ 결과 페이지로 이동");
      setCurrentPage("results");
    } else {
      console.log("❌ 모든 API 실패");
      setError(
        "모든 데이터를 가져오는데 실패했습니다. 네트워크 상태를 확인하고 다시 시도해주세요."
      );
      setCurrentPage("main");
    }
  };

  // 🎯 개별 API 처리 함수 (tempResults 추가)
  const handleIndividualAPI = async (apiName, apiCall, tempResults) => {
    try {
      console.log(`🚀 ${apiName} API 시작`);

      // 🎯 API 호출 실행
      const result = await apiCall();

      // 🎯 성공 시 즉시 상태 업데이트
      updateApiStatus(apiName, {
        loading: false,
        completed: true,
        error: null,
      });
      updateApiResult(apiName, result);

      // 🎯 임시 결과에도 저장
      tempResults[apiName] = result;

      console.log(`✅ ${apiName} API 성공`);
      return result;
    } catch (error) {
      console.error(`❌ ${apiName} API 실패:`, error);

      // 🎯 실패 시 즉시 상태 업데이트
      const errorMessage = error.message || `${apiName} API 호출 실패`;
      updateApiStatus(apiName, {
        loading: false,
        completed: false,
        error: errorMessage,
      });
      updateApiResult(apiName, null);

      // 🎯 임시 결과는 null 유지
      tempResults[apiName] = null;

      throw error;
    }
  };

  // 메인 페이지로 돌아가기
  const handleBackToMain = () => {
    setCurrentPage("main");
    setSearchData(null);
    setError(null);
    setLoadingStatus({
      summary: { loading: false, completed: false, error: null },
      jobs: { loading: false, completed: false, error: null },
      realestate: { loading: false, completed: false, error: null },
      policies: { loading: false, completed: false, error: null },
    });
    setResultData({
      summary: null,
      jobs: null,
      realestate: null,
      policies: null,
    });
  };

  return (
    <div className="App">
      {currentPage === "main" && (
        <MainPage onSubmit={handleSearch} error={error} />
      )}

      {currentPage === "loading" && (
        <LoadingPage
          searchPrompt={searchData?.prompt}
          loadingStatus={loadingStatus}
        />
      )}

      {currentPage === "results" && searchData && (
        <ResultsPage
          searchData={searchData}
          resultData={resultData}
          onBackToMain={handleBackToMain}
        />
      )}
    </div>
  );
}

export default App;
