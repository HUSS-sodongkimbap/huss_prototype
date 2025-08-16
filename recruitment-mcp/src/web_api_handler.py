# src/web_api_handler.py
from typing import Dict, Any, Optional, List
from datetime import datetime

# 상대 import 방식으로 변경
from .enhanced_orchestrator import EnhancedOrchestrator
from .final_chatbot import PerfectChatbot

class WebAPIHandler:
    def __init__(self):
        self.orchestrator = EnhancedOrchestrator()
        self.chatbot = PerfectChatbot()
    
    async def search_comprehensive(self, query: str, region_code: str = "44790") -> Dict[str, Any]:
        """요약 페이지용 - 전체 데이터 통합"""
        try:
            # 자연어 의도 분석
            intent = self.chatbot.analyze_user_intent(query)
            if region_code:
                intent["region_mentioned"] = region_code
            
            # 모든 타입 검색 강제
            intent["search_jobs"] = True
            intent["search_realestate"] = True
            intent["search_policies"] = True
            
            # 각 영역별 데이터 수집
            raw_data = await self._get_raw_data(intent)
            
            # 요약 정보 생성
            summary = self._generate_summary(raw_data, region_code)
            
            return {
                "success": True,
                "summary": summary,
                "preview_data": {
                    "jobs": raw_data["jobs"][:3],
                    "realestate": raw_data["realestate"][:3],
                    "policies": raw_data["policies"][:3]
                },
                "region_info": {
                    "code": region_code,
                    "name": self.chatbot.get_region_name(region_code)
                },
                "search_metadata": {
                    "query": query,
                    "timestamp": datetime.now().isoformat(),
                    "intent_type": intent.get("type", "comprehensive")
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def search_jobs_only(self, region_code: str, filters: Dict = None) -> Dict[str, Any]:
        """일자리 페이지용 - final_chatbot.py와 동일한 로직 사용"""
        try:
            # 🎯 final_chatbot.py와 정확히 같은 방식으로 채용정보 검색
            job_result = self.orchestrator.call_recruitment_tool(
                'listRecruitments',
                {
                    'pageNo': 1,
                    'numOfRows': 100,  # final_chatbot.py와 동일
                    'filters': {**filters} if filters else {}
                }
            )
            
            jobs = []
            if job_result["status"] == "success":
                raw_jobs = job_result["result"].get("data", {}).get("result", [])
                
                # 🎯 final_chatbot.py와 동일한 지역 필터링 및 정렬 적용
                jobs = self.chatbot.filter_and_sort_jobs_by_region(raw_jobs, region_code)
            
            # 🎯 final_chatbot.py의 format_job_results 함수와 동일한 포맷팅을 JSON으로 변환
            formatted_jobs = []
            region_name = self.chatbot.get_region_name(region_code)
            
            for i, job in enumerate(jobs[:15], 1):  # 상위 15개 (final_chatbot.py 기본값)
                title = job.get("recrutPbancTtl", "제목 없음")
                company = job.get("instNm", "기관명 없음")
                hire_type = job.get("hireTypeNmLst", "")
                region = job.get("workRgnNmLst", "")
                deadline = job.get("pbancEndYmd", "")
                ncs_field = job.get("ncsCdNmLst", "")
                
                # 마감일 포맷팅 (final_chatbot.py와 동일)
                formatted_deadline = ""
                if deadline and len(deadline) == 8:
                    formatted_deadline = f"{deadline[:4]}.{deadline[4:6]}.{deadline[6:]}"
                
                # 지역 표시 포맷팅 (final_chatbot.py와 동일)
                region_display = region
                if region:
                    region_count = region.count(',') + 1
                    if region_count >= 10:
                        region_display = f"전국 ({region_count}개 지역)"
                    elif region_count > 3:
                        region_display = f"{region.split(',')[0]} 외 {region_count-1}개 지역"
                    else:
                        region_display = region
                
                # final_chatbot.py와 동일한 구조로 포맷팅
                formatted_job = {
                    **job,  # 원본 데이터 유지
                    
                    # final_chatbot.py에서 표시하는 추가 정보들
                    "display_number": i,
                    "display_title": f"{i}. {company} ({hire_type})",
                    "formatted_title": title,
                    "formatted_company": company,
                    "formatted_hire_type": hire_type,
                    "formatted_region": region_display,
                    "formatted_deadline": formatted_deadline if formatted_deadline else "미정",
                    "formatted_ncs_field": ncs_field,
                    
                    # 추가 필드들
                    "acbg_cond": job.get("acbgCondLst", ""),
                    "career_cond": job.get("creerCondLst", ""),
                    "major_field": job.get("mjrfldNmLst", ""),
                    "recruit_count": job.get("rcritNmprCo", ""),
                    "work_type": job.get("workTypeNmLst", ""),
                    "salary_type": job.get("salaryTypeNmLst", ""),
                    "contact_info": job.get("cntctNo", ""),
                    "recruit_start_date": job.get("pbancBgngYmd", ""),
                    "application_method": job.get("aplyMthdNmLst", "")
                }
                
                formatted_jobs.append(formatted_job)
            
            # 통계 계산 (final_chatbot.py의 _calculate_job_stats와 동일)
            statistics = self._calculate_job_stats_detailed(jobs)
            
            return {
                "success": True,
                "jobs": formatted_jobs,
                "statistics": statistics,
                "total_count": len(jobs),
                "filters_applied": filters,
                "region_info": {
                    "code": region_code,
                    "name": region_name
                },
                # final_chatbot.py 스타일 메시지 추가
                "summary_message": f"📋 **{region_name} 지역의 채용정보를 찾을 수 없습니다.**" if not jobs else f"📋 **채용정보** (총 {len(jobs)}건, 지역 관련성 순)"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _calculate_job_stats_detailed(self, jobs: List[Dict]) -> Dict[str, Any]:
        """상세 채용 통계 계산 (final_chatbot.py 스타일)"""
        if not jobs:
            return {
                "total": 0, 
                "by_category": {}, 
                "by_type": {},
                "by_education": {},
                "by_region": {},
                "by_deadline": {}
            }
        
        categories = {}
        types = {}
        education = {}
        regions = {}
        deadlines = {}
        
        for job in jobs:
            # 직무분야별 통계
            ncs_field = job.get("ncsCdNmLst", "기타")
            if ncs_field:
                main_category = ncs_field.split(",")[0] if "," in ncs_field else ncs_field
                categories[main_category] = categories.get(main_category, 0) + 1
            
            # 고용형태별 통계
            hire_type = job.get("hireTypeNmLst", "기타")
            types[hire_type] = types.get(hire_type, 0) + 1
            
            # 학력조건별 통계
            acbg_cond = job.get("acbgCondLst", "기타")
            education[acbg_cond] = education.get(acbg_cond, 0) + 1
            
            # 지역별 통계
            work_region = job.get("workRgnNmLst", "기타")
            if work_region:
                main_region = work_region.split(",")[0] if "," in work_region else work_region
                regions[main_region] = regions.get(main_region, 0) + 1
            
            # 마감일별 통계
            deadline = job.get("pbancEndYmd", "")
            if deadline and len(deadline) == 8:
                month = f"{deadline[:4]}-{deadline[4:6]}"
                deadlines[month] = deadlines.get(month, 0) + 1
        
        return {
            "total": len(jobs),
            "by_category": dict(sorted(categories.items(), key=lambda x: x[1], reverse=True)),
            "by_type": dict(sorted(types.items(), key=lambda x: x[1], reverse=True)),
            "by_education": dict(sorted(education.items(), key=lambda x: x[1], reverse=True)),
            "by_region": dict(sorted(regions.items(), key=lambda x: x[1], reverse=True)),
            "by_deadline": dict(sorted(deadlines.items()))
        }
    
    async def search_realestate_only(self, region_code: str, deal_ymd: str = "202506") -> Dict[str, Any]:
        """부동산 페이지용 - 실거래가 전문"""
        try:
            # 아파트 실거래가 수집
            apt_result = self.orchestrator.call_realestate_tool(
                'getApartmentTrades',
                {
                    'lawdcd': region_code,
                    'deal_ymd': deal_ymd,
                    'pageNo': 1,
                    'numOfRows': 30
                }
            )
            
            properties = []
            if apt_result["status"] == "success":
                apt_text = apt_result["result"].get("text", "")
                properties = self.chatbot.parse_apartment_xml(apt_text)
            
            return {
                "success": True,
                "properties": properties,
                "price_analysis": self._analyze_price_trends(properties),
                "deal_period": deal_ymd,
                "region_info": {
                    "code": region_code,
                    "name": self.chatbot.get_region_name(region_code)
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
# src/web_api_handler.py의 search_policies_only 함수를 완전히 교체

    async def search_policies_only(self, region_code: str, keywords: str = None) -> Dict[str, Any]:
        """정책 페이지용 - final_chatbot.py와 동일한 로직 사용"""
        try:
            # 🎯 final_chatbot.py와 정확히 같은 방식으로 정책 검색
            policy_result = self.orchestrator.call_youth_policy_tool(
                'searchPoliciesByRegion',
                {
                    'regionCode': region_code,
                    'pageNum': 1,
                    'pageSize': 30  # final_chatbot.py와 동일
                }
            )
            
            policies = []
            if policy_result["status"] == "success":
                all_policies = policy_result["result"].get("policies", [])
                
                # 🎯 final_chatbot.py와 동일한 필터링 적용
                active_policies = self.chatbot.filter_active_policies(all_policies)
                policies = self.chatbot.filter_and_sort_policies_by_region(active_policies, region_code)
            
            # 🎯 final_chatbot.py의 format_policy_results 함수와 동일한 포맷팅을 JSON으로 변환
            formatted_policies = []
            for i, policy in enumerate(policies[:5], 1):  # 상위 5개만 (final_chatbot.py 기본값)
                
                # 날짜 포맷팅 함수 (final_chatbot.py와 동일)
                def format_date(date_str):
                    if date_str and len(date_str) == 8 and date_str.isdigit():
                        return f"{date_str[:4]}년 {date_str[4:6]}월 {date_str[6:]}일"
                    return date_str

                def format_apply_period(apply_str):
                    if not apply_str:
                        return ""
                    if " ~ " in apply_str:
                        dates = apply_str.split(" ~ ")
                        if len(dates) == 2:
                            start_formatted = format_date(dates[0].strip())
                            end_formatted = format_date(dates[1].strip())
                            return f"{start_formatted} ~ {end_formatted}"
                    return format_date(apply_str)

                # 사업 기간 계산
                business_start = policy.get("bizPrdBgngYmd", "")
                business_end = policy.get("bizPrdEndYmd", "")
                business_period = ""
                if business_start and business_end:
                    if business_start.strip() and business_end.strip() and business_start != "00000000" and business_end != "00000000":
                        business_period = f"{format_date(business_start)} ~ {format_date(business_end)}"
                elif business_start and business_start.strip() and business_start != "00000000":
                    business_period = f"{format_date(business_start)} ~"
                elif business_end and business_end.strip() and business_end != "00000000":
                    business_period = f"~ {format_date(business_end)}"

                # 적용 범위 계산 (final_chatbot.py와 동일)
                zip_codes = policy.get('zipCd', '')
                if zip_codes:
                    region_count = len(zip_codes.split(',')) if ',' in zip_codes else 1
                    if region_count >= 50:
                        scope_display = f"전국 ({region_count}개 지역)"
                    elif region_count > 10:
                        scope_display = f"광역 ({region_count}개 지역)"
                    elif region_count > 1:
                        scope_display = f"다지역 ({region_count}개 지역)"
                    else:
                        scope_display = "지역특화"
                else:
                    scope_display = "범위미상"

                # 신청 기간 포맷팅
                apply_period = policy.get("aplyYmd", "")
                formatted_apply_period = format_apply_period(apply_period) if apply_period else ""

                # 상세 링크 생성
                policy_no = policy.get("plcyNo", "")
                detail_url = f"https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch/ythPlcyDetail/{policy_no}" if policy_no else ""

                # final_chatbot.py와 동일한 구조로 포맷팅
                formatted_policy = {
                    **policy,  # 원본 데이터 유지
                    
                    # final_chatbot.py에서 표시하는 추가 정보들
                    "display_title": f"{i}. {policy.get('plcyNm', '정책명 없음')}",
                    "formatted_explanation": policy.get('plcyExplnCn', '설명 없음'),
                    "category_display": f"{policy.get('lclsfNm', '')} > {policy.get('mclsfNm', '')}",
                    "scope_display": scope_display,
                    "keywords_display": policy.get('plcyKywdNm', ''),
                    "institution_display": policy.get('sprvsnInstCdNm', ''),
                    "support_content_display": policy.get('plcySprtCn', ''),
                    "business_period_display": business_period,
                    "apply_period_display": formatted_apply_period if formatted_apply_period else "상시접수",
                    "support_scale_display": f"{policy.get('sprtSclCnt', '0')}명" if policy.get('sprtSclCnt') and policy.get('sprtSclCnt') != "0" else "",
                    "apply_method_display": policy.get('plcyAplyMthdCn', ''),
                    "additional_conditions_display": policy.get('addAplyQlfcCndCn', ''),
                    "participation_target_display": policy.get('ptcpPrpTrgtCn', ''),
                    "detail_url": detail_url
                }
                
                formatted_policies.append(formatted_policy)
            
            return {
                "success": True,
                "policies": formatted_policies,
                "categories": self._group_policies_by_category(policies),
                "total_count": len(policies),
                "keywords_used": keywords,
                "region_info": {
                    "code": region_code,
                    "name": self.chatbot.get_region_name(region_code)
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # 🎯 추가: 헬퍼 메서드들
    def _format_business_period(self, policy: Dict) -> str:
        """사업 기간 포맷팅"""
        start = policy.get("bizPrdBgngYmd", "")
        end = policy.get("bizPrdEndYmd", "")
        
        def format_date(date_str):
            if date_str and len(date_str) == 8 and date_str.isdigit():
                return f"{date_str[:4]}년 {date_str[4:6]}월 {date_str[6:]}일"
            return date_str
        
        if start and end and start != "00000000" and end != "00000000":
            return f"{format_date(start)} ~ {format_date(end)}"
        elif start and start != "00000000":
            return f"{format_date(start)} ~"
        elif end and end != "00000000":
            return f"~ {format_date(end)}"
        return "기간 정보 없음"

    def _format_apply_period(self, apply_str: str) -> str:
        """신청 기간 포맷팅"""
        if not apply_str:
            return "상시접수"
        
        def format_date(date_str):
            if date_str and len(date_str) == 8 and date_str.isdigit():
                return f"{date_str[:4]}년 {date_str[4:6]}월 {date_str[6:]}일"
            return date_str
        
        if " ~ " in apply_str:
            dates = apply_str.split(" ~ ")
            if len(dates) == 2:
                start_formatted = format_date(dates[0].strip())
                end_formatted = format_date(dates[1].strip())
                return f"{start_formatted} ~ {end_formatted}"
        
        return format_date(apply_str) if apply_str else "상시접수"

    def _calculate_policy_scope(self, policy: Dict) -> str:
        """정책 적용 범위 계산"""
        zip_codes = policy.get('zipCd', '')
        if zip_codes:
            region_count = len(zip_codes.split(',')) if ',' in zip_codes else 1
            if region_count >= 50:
                return f"전국 ({region_count}개 지역)"
            elif region_count > 10:
                return f"광역 ({region_count}개 지역)"
            elif region_count > 1:
                return f"다지역 ({region_count}개 지역)"
            else:
                return "지역특화"
        return "범위미상"
    
    async def _get_raw_data(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """원시 데이터 수집"""
        region_code = intent.get("region_mentioned", "44790")
        results = {"jobs": [], "realestate": [], "policies": []}
        
        # 채용정보
        if intent["search_jobs"]:
            job_result = self.orchestrator.call_recruitment_tool(
                'listRecruitments',
                {'pageNo': 1, 'numOfRows': 20, 'filters': intent.get("filters", {})}
            )
            if job_result["status"] == "success":
                jobs = job_result["result"].get("data", {}).get("result", [])
                results["jobs"] = self.chatbot.filter_and_sort_jobs_by_region(jobs, region_code)
        
        # 부동산
        if intent["search_realestate"]:
            apt_result = self.orchestrator.call_realestate_tool(
                'getApartmentTrades',
                {'lawdcd': region_code, 'deal_ymd': "202506", 'pageNo': 1, 'numOfRows': 15}
            )
            if apt_result["status"] == "success":
                apt_text = apt_result["result"].get("text", "")
                results["realestate"] = self.chatbot.parse_apartment_xml(apt_text)
        
        # 정책
        if intent["search_policies"]:
            policy_result = self.orchestrator.call_youth_policy_tool(
                'searchPoliciesByRegion',
                {'regionCode': region_code, 'pageNum': 1, 'pageSize': 20}
            )
            if policy_result["status"] == "success":
                policies = policy_result["result"].get("policies", [])
                active_policies = self.chatbot.filter_active_policies(policies)
                results["policies"] = self.chatbot.filter_and_sort_policies_by_region(active_policies, region_code)
        
        return results
    
    def _generate_summary(self, raw_data: Dict[str, Any], region_code: str) -> Dict[str, Any]:
        """요약 페이지용 통계 생성"""
        return {
            "region_name": self.chatbot.get_region_name(region_code),
            "total_jobs": len(raw_data["jobs"]),
            "total_properties": len(raw_data["realestate"]),
            "total_policies": len(raw_data["policies"]),
            "avg_property_price": self._calculate_avg_price(raw_data["realestate"]),
            "top_job_categories": self._get_top_job_categories(raw_data["jobs"]),
            "urgent_policies": len([p for p in raw_data["policies"][:5] if self._is_urgent_policy(p)])
        }
    
    def _calculate_job_stats(self, jobs: List[Dict]) -> Dict[str, Any]:
        """채용 통계 계산"""
        if not jobs:
            return {"total": 0, "by_category": {}, "by_type": {}}
        
        categories = {}
        types = {}
        
        for job in jobs:
            # 직무분야별 통계
            ncs_field = job.get("ncsCdNmLst", "기타")
            categories[ncs_field] = categories.get(ncs_field, 0) + 1
            
            # 고용형태별 통계
            hire_type = job.get("hireTypeNmLst", "기타")
            types[hire_type] = types.get(hire_type, 0) + 1
        
        return {
            "total": len(jobs),
            "by_category": categories,
            "by_type": types
        }
    
    def _calculate_avg_price(self, properties: List[Dict]) -> str:
        """평균 매매가 계산"""
        if not properties:
            return "데이터 없음"
        
        prices = []
        for prop in properties:
            price_str = prop.get("dealAmount", "").replace(",", "")
            if price_str.isdigit():
                prices.append(int(price_str))
        
        if prices:
            avg = sum(prices) // len(prices)
            if avg >= 10000:
                return f"{avg//10000}억 {(avg%10000):,}만원"
            else:
                return f"{avg:,}만원"
        return "계산 불가"
    
    def _get_top_job_categories(self, jobs: List[Dict]) -> List[str]:
        """상위 직무분야 추출"""
        categories = {}
        for job in jobs:
            category = job.get("ncsCdNmLst", "").split(",")[0] if job.get("ncsCdNmLst") else "기타"
            categories[category] = categories.get(category, 0) + 1
        
        sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        return [cat[0] for cat in sorted_categories[:3]]
    
    def _analyze_price_trends(self, properties: List[Dict]) -> Dict[str, Any]:
        """가격 트렌드 분석"""
        if not properties:
            return {"trend": "데이터 부족", "price_range": "확인 불가"}
        
        prices = []
        for prop in properties:
            price_str = prop.get("dealAmount", "").replace(",", "")
            if price_str.isdigit():
                prices.append(int(price_str))
        
        if prices:
            min_price = min(prices)
            max_price = max(prices)
            return {
                "trend": "안정세",
                "price_range": f"{min_price:,}만원 ~ {max_price:,}만원",
                "sample_count": len(prices)
            }
        
        return {"trend": "데이터 부족", "price_range": "확인 불가"}
    
    def _group_policies_by_category(self, policies: List[Dict]) -> Dict[str, int]:
        """정책 카테고리별 그룹핑"""
        categories = {}
        for policy in policies:
            category = policy.get("lclsfNm", "기타")
            categories[category] = categories.get(category, 0) + 1
        return categories
    
    def _is_urgent_policy(self, policy: Dict) -> bool:
        """긴급 정책 여부 판단 (마감 임박)"""
        # 간단한 로직: 신청기간이 있고 특정 키워드가 포함된 경우
        apply_period = policy.get("aplyYmd", "")
        return "마감" in apply_period or "긴급" in policy.get("plcyNm", "")