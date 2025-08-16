// src/components/MainPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import './MainPage.css';
import logo from '../assets/ieum_logo.svg';

function MainPage({ onSubmit }) { // onSubmit prop을 받도록 수정
    const [isInputActive, setIsInputActive] = useState(false);
    const [prompt, setPrompt] = useState("");
    const promptWrapperRef = useRef(null);
    const sendButtonRef = useRef(null);

    const handleSubmit = (event) => {
        if (event) {
            event.preventDefault();
        }
        if (prompt.trim() === "") {
            alert("전송할 내용을 입력해주세요.");
            return;
        }
        // 부모(App.jsx)로부터 받은 onSubmit 함수를 호출하여 프롬프트 값을 전달
        onSubmit(prompt);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(null);
            if (sendButtonRef.current) {
                sendButtonRef.current.classList.add('active');
                setTimeout(() => {
                    if (sendButtonRef.current) {
                        sendButtonRef.current.classList.remove('active');
                    }
                }, 150);
            }
        }
    };

    const handleClickOutside = (event) => {
        if (promptWrapperRef.current && !promptWrapperRef.current.contains(event.target)) {
            setIsInputActive(false);
        }
    };

    useEffect(() => {
        if (isInputActive) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isInputActive]);

    const handleInputClick = () => {
        setIsInputActive(true);
    };

    return (
        <div className="main-container">
            <header className="header">
                <img src={logo} alt="ieum logo" className="logo" />
                <nav className="nav-links">
                    <a href="#">서비스 소개</a>
                    <a href="#">언어</a>
                    <a href="#">도움말</a>
                </nav>
            </header>

            <main className="content">
                <h1>
                    나의 새로운 시작은
                    <br />
                    어디서?
                </h1>
                <p>이음이 당신에게 꼭 맞는 지역을 찾아드려요</p>

                <div className="prompt-wrapper" ref={promptWrapperRef}>
                    {!isInputActive ? (
                        <button className="prompt-placeholder" onClick={handleInputClick}>
                            나에게 맞는 조건 입력하기
                            <span className="enter-icon">↵</span>
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="prompt-form">
                            <textarea
                                className="prompt-input"
                                placeholder="원하는 직업, 필요한 정책, 주거 예산을 자유롭게 입력해보세요."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <button type="submit" className="send-button" ref={sendButtonRef}>Send</button>
                        </form>
                    )}
                </div>

                {isInputActive && (
                    <div className="prompt-examples">
                        <p>예시: 서울에서 IT 프론트엔드 개발자로 일하고 싶어. 청년 버팀목 대출이 가능한 전세 2억 이하의 집이었으면 좋겠어.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default MainPage;