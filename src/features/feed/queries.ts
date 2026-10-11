export function buildSearchQueries(): {
  investments: string[];
  expos: string[];
} {
  const now = new Date();
  const year = now.getFullYear();

  return {
    investments: [
      // 5 sector-specific queries
      `最近3个月 中国 AI人工智能 大模型 AIGC Agent 融资投资事件 金额 投资机构`,
      `最近3个月 中国 医疗健康 生物医药 创新药 基因治疗 融资投资事件`,
      `最近3个月 中国 新能源 智能汽车 自动驾驶 固态电池 融资投资事件`,
      `最近3个月 中国 半导体 芯片 机器人 硬科技 融资投资`,
      `最近半年 中国科技创投领域 C轮D轮Pre-IPO 重大融资事件`,
      // 5 institution-specific queries (NEW)
      `红杉中国 IDG资本 高瓴创投 经纬创投 ${year} 最新投资案例 被投企业`,
      `腾讯投资 阿里战投 百度风投 字节跳动 美团龙珠 ${year} 最新投资`,
      `深创投 达晨财智 中金资本 国投创新 鼎晖投资 ${year} 最新投资`,
      `${year} 中国科技创业 天使轮 A轮 B轮 融资事件 初创企业`,
      `${year} 中国独角兽 大额融资 数亿美元 数亿人民币 融资完成`,
    ],
    expos: [
      `WAIC 世界人工智能大会 ${year} 上海 中国参展企业 展商名单`,
      `CES ${year} 拉斯维加斯 中国参展企业 展商`,
      `MWC ${year} 巴塞罗那 中国企业参展 展商`,
      `北京车展 上海车展 广州车展 汉诺威工博会 世界机器人大会 ${year} 中国参展`,
      `COMPUTEX GITEX IFA NeurIPS CVPR Google-IO ${year} ${year + 1} 中国参展`,
    ],
  };
}
