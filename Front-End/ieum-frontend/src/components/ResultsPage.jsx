// src/components/ResultsPage.jsx
import React, { useState } from "react";
import "./ResultsPage.css";

function ResultsPage({ searchData, resultData, onBackToMain }) {
  const [activeTab, setActiveTab] = useState("summary");

  // 탭 변경 시에는 즉시 표시 (데이터가 이미 로드됨)
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // 요약 탭 렌더링
  const renderSummaryTab = () => {
    if (!resultData.summary || !resultData.summary.success)
      return (
        <div className="no-data">종합 분석 데이터를 불러올 수 없습니다.</div>
      );

    const summary = resultData.summary.summary || {};
    const preview = resultData.summary.preview_data || {};

    return (
      <div>
        <h3>🌟 {summary.region_name} 종합 분석</h3>

        <div className="summary-grid">
          <div className="summary-card">
            <h3>{summary.total_jobs || 0}</h3>
            <p>채용공고</p>
          </div>
          <div className="summary-card">
            <h3>{summary.total_properties || 0}</h3>
            <p>부동산 매물</p>
          </div>
          <div className="summary-card">
            <h3>{summary.total_policies || 0}</h3>
            <p>지원정책</p>
          </div>
          <div className="summary-card">
            <h3>{summary.avg_property_price || "N/A"}</h3>
            <p>평균 매매가</p>
          </div>
        </div>

        <h4>🔍 미리보기</h4>
        <div className="data-list">
          {preview.jobs?.slice(0, 2).map((job, index) => (
            <div key={index} className="data-item">
              <h4>📋 {job.instNm || "기관명 없음"}</h4>
              <p>{job.recrutPbancTtl || "제목 없음"}</p>
              <p>📍 {job.workRgnNmLst || "근무지역 미정"}</p>
            </div>
          ))}

          {preview.realestate?.slice(0, 2).map((property, index) => (
            <div key={index} className="data-item">
              <h4>🏠 {property.aptNm || "아파트명 없음"}</h4>
              <p>💰 {property.dealAmount || "가격 정보 없음"}만원</p>
              <p>📐 {property.excluUseAr || "면적 정보 없음"}㎡</p>
            </div>
          ))}

          {preview.policies?.slice(0, 2).map((policy, index) => (
            <div key={index} className="data-item">
              <h4>🎯 {policy.plcyNm || "정책명 없음"}</h4>
              <p>{policy.plcyExplnCn?.substring(0, 100) || "설명 없음"}...</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 일자리 탭 렌더링
  const renderJobsTab = () => {
    if (!resultData.jobs || !resultData.jobs.success)
      return <div className="no-data">일자리 정보를 불러올 수 없습니다.</div>;

    const jobs = resultData.jobs.jobs || [];
    const stats = resultData.jobs.statistics || {};
    const regionName = resultData.jobs.region_info?.name || "";

    return (
      <div>
        <h3>
          💼 {regionName} 채용정보 ({stats.total || 0}건)
        </h3>

        {jobs.length === 0 ? (
          <div className="no-data">
            <p>
              📋{" "}
              <strong>{regionName} 지역의 채용정보를 찾을 수 없습니다.</strong>
            </p>
            <br />
            <p>
              💡 <strong>제안:</strong>
            </p>
            <p>- 인근 시·군으로 확장해보세요</p>
            <p>- 원격근무 가능한 직종을 찾아보세요</p>
          </div>
        ) : (
          <>
            {Object.keys(stats.by_category || {}).length > 0 && (
              <div className="summary-grid" style={{ marginBottom: "1rem" }}>
                <div className="summary-card">
                  <h3>{stats.total}</h3>
                  <p>총 채용공고</p>
                </div>
                <div className="summary-card">
                  <h3>{Object.keys(stats.by_category).length}</h3>
                  <p>직무분야</p>
                </div>
                <div className="summary-card">
                  <h3>{Object.keys(stats.by_type || {}).length}</h3>
                  <p>고용형태</p>
                </div>
                <div className="summary-card">
                  <h3>{Object.keys(stats.by_region || {}).length}</h3>
                  <p>근무지역</p>
                </div>
              </div>
            )}

            <div className="data-list">
              {jobs.map((job, index) => (
                <div key={index} className="data-item">
                  <div
                    style={{
                      borderBottom: "1px solid #eee",
                      paddingBottom: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <h4>
                      📝{" "}
                      <strong>
                        {job.display_number}. {job.formatted_company}
                      </strong>{" "}
                      ({job.formatted_hire_type})
                    </h4>
                    <p>
                      📌 <strong>{job.formatted_title}</strong>
                    </p>
                    {job.formatted_region && (
                      <p>
                        🌍 <strong>근무지역</strong>: {job.formatted_region}
                      </p>
                    )}
                    {job.formatted_deadline && (
                      <p>
                        ⏰ <strong>마감일</strong>: {job.formatted_deadline}
                      </p>
                    )}
                    {job.formatted_ncs_field && (
                      <p>
                        🔧 <strong>직무분야</strong>: {job.formatted_ncs_field}
                      </p>
                    )}
                    {job.formatted_education && (
                      <p>
                        🎓 <strong>학력요건</strong>: {job.formatted_education}
                      </p>
                    )}
                    {job.career_cond && (
                      <p>
                        💼 <strong>경력조건</strong>: {job.career_cond}
                      </p>
                    )}
                    {job.recruit_count && (
                      <p>
                        👥 <strong>모집인원</strong>: {job.recruit_count}명
                      </p>
                    )}
                    {job.work_type && (
                      <p>
                        ⏰ <strong>근무형태</strong>: {job.work_type}
                      </p>
                    )}
                    {job.salary_type && (
                      <p>
                        💰 <strong>급여형태</strong>: {job.salary_type}
                      </p>
                    )}
                    {job.application_method && (
                      <p>
                        📝 <strong>지원방법</strong>: {job.application_method}
                      </p>
                    )}
                    {job.contact_info && (
                      <p>
                        📞 <strong>문의처</strong>: {job.contact_info}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(stats.by_category || {}).length > 0 && (
              <div
                style={{
                  marginTop: "2rem",
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <h4>📊 채용 현황 요약</h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <strong>주요 직무분야:</strong>
                    <ul style={{ margin: "0.5rem 0", paddingLeft: "1rem" }}>
                      {Object.entries(stats.by_category)
                        .slice(0, 3)
                        .map(([category, count]) => (
                          <li key={category}>
                            {category}: {count}건
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <strong>고용형태:</strong>
                    <ul style={{ margin: "0.5rem 0", paddingLeft: "1rem" }}>
                      {Object.entries(stats.by_type || {})
                        .slice(0, 3)
                        .map(([type, count]) => (
                          <li key={type}>
                            {type}: {count}건
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // 부동산 탭 렌더링
  const renderRealestateTab = () => {
    if (!resultData.realestate || !resultData.realestate.success)
      return <div className="no-data">부동산 정보를 불러올 수 없습니다.</div>;

    const properties = resultData.realestate.properties || [];
    const analysis = resultData.realestate.price_analysis || {};

    return (
      <div>
        <h3>🏠 아파트 실거래가 ({properties.length}건)</h3>

        {analysis.price_range && (
          <div className="summary-card" style={{ marginBottom: "1rem" }}>
            <p>💰 가격대: {analysis.price_range}</p>
            <p>📊 시장 동향: {analysis.trend}</p>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="no-data">해당 지역의 실거래 정보가 없습니다.</div>
        ) : (
          <div className="data-list">
            {properties.map((property, index) => (
              <div key={index} className="data-item">
                <h4>{property.aptNm || "아파트명 없음"}</h4>
                <p>💰 거래금액: {property.dealAmount || "정보 없음"}만원</p>
                <p>📐 전용면적: {property.excluUseAr || "정보 없음"}㎡</p>
                <p>🏢 층수: {property.floor || "정보 없음"}층</p>
                <p>🗓️ 건축년도: {property.buildYear || "정보 없음"}년</p>
                <p>📍 위치: {property.umdNm || "정보 없음"}</p>
                <p>
                  📅 거래일: {property.dealYear || ""}.
                  {property.dealMonth || ""}.{property.dealDay || ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 정책 탭 렌더링
  const renderPoliciesTab = () => {
    if (!resultData.policies || !resultData.policies.success)
      return <div className="no-data">정책 정보를 불러올 수 없습니다.</div>;

    const policies = resultData.policies.policies || [];
    const categories = resultData.policies.categories || {};

    return (
      <div>
        <h3>🎯 청년지원정책 ({policies.length}건)</h3>

        {Object.keys(categories).length > 0 && (
          <div className="summary-grid" style={{ marginBottom: "1rem" }}>
            {Object.entries(categories).map(([category, count]) => (
              <div key={category} className="summary-card">
                <h3>{count}</h3>
                <p>{category}</p>
              </div>
            ))}
          </div>
        )}

        {policies.length === 0 ? (
          <div className="no-data">해당 지역의 청년정책이 없습니다.</div>
        ) : (
          <div className="data-list">
            {policies.map((policy, index) => (
              <div key={index} className="data-item">
                <h4>{policy.plcyNm || "정책명 없음"}</h4>
                <p>{policy.plcyExplnCn?.substring(0, 200) || "설명 없음"}...</p>
                <p>🏛️ 담당기관: {policy.sprvsnInstCdNm || "정보 없음"}</p>
                <p>
                  📂 분야:{" "}
                  {[policy.lclsfNm, policy.mclsfNm]
                    .filter(Boolean)
                    .join(" > ") || "분야 정보 없음"}
                </p>
                <p>🎯 적용범위: {policy.scope_display || "범위 정보 없음"}</p>
                <p>
                  💰 지원내용:{" "}
                  {policy.support_content_display || "지원내용 정보 없음"}
                </p>
                <p>
                  📅 사업기간:{" "}
                  {policy.business_period_display || "기간 정보 없음"}
                </p>
                <p>📋 신청기간: {policy.apply_period_display || "상시접수"}</p>
                {policy.sprtSclCnt && policy.sprtSclCnt !== "0" && (
                  <p>👥 지원규모: {policy.support_scale_display}</p>
                )}
                {policy.plcyKywdNm && <p>🏷️ 키워드: {policy.plcyKywdNm}</p>}
                {policy.detail_url && (
                  <p>
                    🔗{" "}
                    <a
                      href={policy.detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      상세보기
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>검색 결과</h1>
        <p>"{searchData.prompt}"에 대한 분석 결과입니다.</p>
        <button className="back-button" onClick={onBackToMain}>
          ← 새로운 검색
        </button>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => handleTabChange("summary")}
          >
            📊 종합 요약
          </button>
          <button
            className={`tab-button ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => handleTabChange("jobs")}
          >
            💼 일자리
          </button>
          <button
            className={`tab-button ${
              activeTab === "realestate" ? "active" : ""
            }`}
            onClick={() => handleTabChange("realestate")}
          >
            🏠 부동산
          </button>
          <button
            className={`tab-button ${activeTab === "policies" ? "active" : ""}`}
            onClick={() => handleTabChange("policies")}
          >
            🎯 정책
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "summary" && renderSummaryTab()}
          {activeTab === "jobs" && renderJobsTab()}
          {activeTab === "realestate" && renderRealestateTab()}
          {activeTab === "policies" && renderPoliciesTab()}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
