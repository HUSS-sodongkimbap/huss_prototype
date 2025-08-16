// src/components/LoadingPage.jsx
import React, { useState, useEffect } from "react";
import AnimatedText from "./AnimatedText";
import AnimatedMap from "./AnimatedMap";
import "./LoadingPage.css";
import logo from "../assets/ieum_logo.svg";

function LoadingPage({ searchPrompt = null, loadingStatus = {} }) {
  // 각 API 상태를 표시하는 함수
  const getStatusIcon = (status) => {
    if (status.loading) return "🔄";
    if (status.completed) return "✅";
    if (status.error) return "❌";
    return "⏳";
  };

  const getStatusText = (status) => {
    if (status.loading) return "로딩 중";
    if (status.completed) return "완료";
    if (status.error) return "실패";
    return "대기 중";
  };

  const getStatusClass = (status) => {
    if (status.loading) return "loading";
    if (status.completed) return "completed";
    if (status.error) return "error";
    return "waiting";
  };

  return (
    <div className="loading-container">
      <header className="header">
        <img src={logo} alt="ieum logo" className="logo" />
        <nav className="nav-links">
          <a href="#">서비스 소개</a>
          <a href="#">언어</a>
          <a href="#">도움말</a>
        </nav>
      </header>
      <main className="loading-content">
        <div className="text-area">
          <AnimatedText />

          {/* 검색어 표시 */}
          {searchPrompt && (
            <div className="search-prompt-display">
              <p className="search-label">검색 중인 내용:</p>
              <p className="search-prompt">"{searchPrompt}"</p>
            </div>
          )}
        </div>

        {/* 실시간 로딩 상태 - 왼쪽 하단 */}
        <div className="loading-status-panel">
          <h4>🔍 데이터 수집 상황</h4>
          <div className="status-list">
            <div
              className={`status-item ${getStatusClass(
                loadingStatus.summary || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.summary || {})}
              </span>
              <span className="status-label">종합 분석</span>
              <span className="status-text">
                {getStatusText(loadingStatus.summary || {})}
              </span>
            </div>

            <div
              className={`status-item ${getStatusClass(
                loadingStatus.jobs || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.jobs || {})}
              </span>
              <span className="status-label">일자리 정보</span>
              <span className="status-text">
                {getStatusText(loadingStatus.jobs || {})}
              </span>
            </div>

            <div
              className={`status-item ${getStatusClass(
                loadingStatus.realestate || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.realestate || {})}
              </span>
              <span className="status-label">부동산 정보</span>
              <span className="status-text">
                {getStatusText(loadingStatus.realestate || {})}
              </span>
            </div>

            <div
              className={`status-item ${getStatusClass(
                loadingStatus.policies || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.policies || {})}
              </span>
              <span className="status-label">정책 정보</span>
              <span className="status-text">
                {getStatusText(loadingStatus.policies || {})}
              </span>
            </div>
          </div>
        </div>

        <div className="map-area">
          <AnimatedMap />
        </div>
      </main>
    </div>
  );
}

export default LoadingPage;
