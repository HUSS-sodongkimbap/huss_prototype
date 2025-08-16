// src/App.jsx
import React, { useState } from "react";
import MainPage from "./components/MainPage";
import ResultsPage from "./components/ResultsPage";
import LoadingPage from "./components/LoadingPage";
import { searchAPI } from "./services/api";

function App() {
  const [currentPage, setCurrentPage] = useState("main");
  const [searchData, setSearchData] = useState(null);
  const [error, setError] = useState(null);

  // 로딩 상태 관리
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

  // 프롬프트에서 지역 정보를 추출하는 함수
  const analyzePromptForRegion = (prompt) => {
    // 백엔드와 동일한 지역 매핑 (final_chatbot.py와 동일)
    const regionMapping = {
      정선: "51770",
      정선군: "51770",
      영월: "51750",
      영월군: "51750",
      청양: "44790",
      청양군: "44790",
      강릉: "51150",
      강릉시: "51150",
      김제: "52210",
      김제시: "52210",
    };

    const text = prompt.toLowerCase().replace(/\s/g, "");

    for (const [regionName, code] of Object.entries(regionMapping)) {
      if (text.includes(regionName.toLowerCase())) {
        return code;
      }
    }

    return "44790"; // 기본값: 청양군 (백엔드와 동일)
  };

  // 검색 실행 함수
  const handleSearch = async (prompt) => {
    setCurrentPage("loading");
    setError(null);

    // 🚀 프롬프트에서 지역 코드 추출
    const regionCode = analyzePromptForRegion(prompt);
    console.log(`🎯 분석된 지역: ${prompt} -> ${regionCode}`);

    // 검색 데이터 설정
    const newSearchData = {
      prompt,
      regionCode, // 동적으로 설정된 지역 코드
    };
    setSearchData(newSearchData);

    // 로딩 상태 초기화
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

    try {
      // 실제 데이터 로딩 시작
      await loadAllAPIData(prompt, newSearchData.regionCode);
    } catch (err) {
      setError(err.message);
      setCurrentPage("main");
    }
  };

  // 모든 API 데이터를 순차적으로 로딩
  const loadAllAPIData = async (prompt, regionCode) => {
    const newResultData = {};

    try {
      // 1. Summary API
      setLoadingStatus((prev) => ({
        ...prev,
        summary: { loading: true, completed: false, error: null },
      }));

      try {
        const summaryResult = await searchAPI.comprehensive(prompt, regionCode);
        newResultData.summary = summaryResult;
        setLoadingStatus((prev) => ({
          ...prev,
          summary: { loading: false, completed: true, error: null },
        }));
      } catch (error) {
        setLoadingStatus((prev) => ({
          ...prev,
          summary: { loading: false, completed: false, error: error.message },
        }));
      }

      // 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Jobs API
      setLoadingStatus((prev) => ({
        ...prev,
        jobs: { loading: true, completed: false, error: null },
      }));

      try {
        const jobsResult = await searchAPI.jobs(regionCode);
        newResultData.jobs = jobsResult;
        setLoadingStatus((prev) => ({
          ...prev,
          jobs: { loading: false, completed: true, error: null },
        }));
      } catch (error) {
        setLoadingStatus((prev) => ({
          ...prev,
          jobs: { loading: false, completed: false, error: error.message },
        }));
      }

      // 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Realestate API
      setLoadingStatus((prev) => ({
        ...prev,
        realestate: { loading: true, completed: false, error: null },
      }));

      try {
        const realestateResult = await searchAPI.realestate(regionCode);
        newResultData.realestate = realestateResult;
        setLoadingStatus((prev) => ({
          ...prev,
          realestate: { loading: false, completed: true, error: null },
        }));
      } catch (error) {
        setLoadingStatus((prev) => ({
          ...prev,
          realestate: {
            loading: false,
            completed: false,
            error: error.message,
          },
        }));
      }

      // 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Policies API
      setLoadingStatus((prev) => ({
        ...prev,
        policies: { loading: true, completed: false, error: null },
      }));

      try {
        const policiesResult = await searchAPI.policies(regionCode);
        newResultData.policies = policiesResult;
        setLoadingStatus((prev) => ({
          ...prev,
          policies: { loading: false, completed: true, error: null },
        }));
      } catch (error) {
        setLoadingStatus((prev) => ({
          ...prev,
          policies: { loading: false, completed: false, error: error.message },
        }));
      }

      // 모든 결과 데이터 저장
      setResultData(newResultData);

      // 잠시 대기 후 결과 페이지로 이동
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentPage("results");
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      setError(error.message);
      setCurrentPage("main");
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
