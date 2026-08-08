// ---- plugin:pe_vc_investment_tech_exhibition_search_1 ----
// ============================================================
// 插件 pe_vc_investment_tech_exhibition_search_1 (PE/VC投资动态与科技展会参展信息搜索) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface PeVcInvestmentTechExhibitionSearchOneInput {
  /** 附加搜索关键词（可选） */
  additional_keywords?: string;
}

/**
 * capabilityClient.load('pe_vc_investment_tech_exhibition_search_1').call<PeVcInvestmentTechExhibitionSearchOneOutput>('searchSummary', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { summary } = result;
 */
export interface PeVcInvestmentTechExhibitionSearchOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:pe_vc_investment_tech_exhibition_search_1 ----

// ---- plugin:investment_exhibition_info_extract_1 ----
// ============================================================
// 插件 investment_exhibition_info_extract_1 (投资事件与展会参展企业信息提取) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface InvestmentExhibitionInfoExtractOneInput {
  /** 包含投资事件和展会参展企业信息的AI搜索结果文本 */
  search_result_text: string;
}

/**
 * capabilityClient.load('investment_exhibition_info_extract_1').call<InvestmentExhibitionInfoExtractOneOutput>('textToJson', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { investment_events, exhibition_companies } = result;
 */
export interface InvestmentExhibitionInfoExtractOneOutput {
  /** 投资事件列表，items schema: {investor: string(投资方), invested_company: string(被投企业), investment_amount: string(投资金额), investment_round: string(投资轮次), investment_date: string(投资时间), investment_industry: string(所属行业)} */
  investment_events: unknown[];
  /** 展会参展企业列表，items schema: {company_name: string(企业名称), industry: string(所属行业), exhibition_products: string(参展产品), company_location: string(企业所在地), exhibition_name: string(展会名称)} */
  exhibition_companies: unknown[];
}
// ---- end:investment_exhibition_info_extract_1 ----

// ---- plugin:exhibition_level_info_extract_1 ----
// ============================================================
// 插件 exhibition_level_info_extract_1 (从搜索结果提取展会级别信息) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface ExhibitionLevelInfoExtractOneInput {
  /** 包含展会信息的搜索结果文本内容 */
  search_result_text: string;
}

/**
 * capabilityClient.load('exhibition_level_info_extract_1').call<ExhibitionLevelInfoExtractOneOutput>('textToJson', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { chinese_exhibitor_count, chinese_exhibitor_names, exhibition_description, ... } = result;
 */
export interface ExhibitionLevelInfoExtractOneOutput {
  /** 中国参展企业的数量，提取到数字直接填写，未找到填0 */
  chinese_exhibitor_count: number;
  /** 中国参展企业名称列表，items schema: {company_name: string(企业名称)} */
  chinese_exhibitor_names: unknown[];
  /** 展会的简要介绍和描述信息 */
  exhibition_description: string;
  /** 展会全称 */
  exhibition_name: string;
  /** 展会类型，如科技展、行业展、贸易展等 */
  exhibition_type: string;
  /** 展会举办日期 */
  exhibition_date: string;
  /** 展会举办地点，包含城市和场馆名称 */
  exhibition_location: string;
}
// ---- end:exhibition_level_info_extract_1 ----