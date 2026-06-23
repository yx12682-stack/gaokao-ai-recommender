# 高考志愿 AI 推荐 Web 应用

本项目使用 React + Vite 构建前端，Express 提供 REST API，并提供全国真实数据接入架构。

重要说明：当前仓库内置的是“来源可追踪的示例结构数据”，用于跑通产品和导入流程，不代表官方录取结果。正式填报必须导入来自各省教育考试院、阳光高考、学校本科招生网等权威来源的数据。

## 本地运行

```bash
npm install --no-audit --no-fund
npm run dev
```

浏览器访问：

```text
http://localhost:5173
```

API 默认运行在：

```text
http://localhost:3001/recommend
```

## API 示例

```bash
curl -X POST http://localhost:3001/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "score": 642,
    "rank": 2600,
    "province": "北京",
    "subject": "physics",
    "cityPreference": 0.72,
    "preferredCities": ["北京", "上海", "杭州"],
    "majors": ["计算机科学与技术", "人工智能"],
    "riskPreference": "balanced"
  }'
```

响应包含：

```text
reach:  冲刺 6 个
match:  稳妥 6 个
safety: 保底 4 个
```

每条推荐还包含：

```text
schoolProfile: 学校预览、优势标签、录取位次洞察
careerGuide: 专业就业方向、职业选择、能力重点、长期发展路径
alternative: 替代学校建议
dataMode: verified / partial / sample / unavailable
dataSource: 来源名称、网址、年份、更新时间、可信度
probabilityExplanation: gap、z、sigmoid 基础概率和修正因子拆解
admissionTrend: 近三年平均位次、趋势、波动
evidence: 推荐证据列表
```

前端支持：

```text
省份：全国 + 全国各省区市
城市偏好：全国 + 主要城市标签
专业偏好：全国专业库，可搜索选择
学校详情：点击推荐卡片中的学校名称或详情按钮打开预览
```

## 核心模型

```text
gap = student_rank - school_avg_rank
z = gap / school_std
probability = 1 / (1 + exp(-k * z))
```

因为排名数值越小代表位次越靠前，当前实现使用负向 `k`，再叠加专业热度、地区竞争、年份趋势、城市偏好和风险偏好的修正因子。

## 真实数据接口

查看数据覆盖率：

```bash
curl http://localhost:3001/data-coverage
```

查看当前数据来源：

```bash
curl http://localhost:3001/data-sources
```

导入权威录取数据：

```bash
curl -X POST http://localhost:3001/data/import \
  -H "Content-Type: application/json" \
  -d '[
    {
      "schoolName": "示例大学",
      "schoolProvince": "北京",
      "schoolType": "公办本科",
      "schoolLevel": "普通本科",
      "city": "北京",
      "province": "北京",
      "major": "计算机科学与技术",
      "year": 2025,
      "minRank": 12000,
      "avgRank": 15000,
      "stdRank": 1800,
      "planCount": 12,
      "subjectRequirement": "物理",
      "sourceType": "provincial_exam_authority",
      "sourceName": "北京市教育考试院 2025 普通高校招生录取数据",
      "sourceUrl": "https://www.bjeea.cn/",
      "updatedAt": "2025-08-31T00:00:00.000Z",
      "verifiedAt": "2026-06-23T00:00:00.000Z",
      "confidence": 0.95,
      "notes": "请替换为实际官方页面或文件地址。"
    }
  ]'
```

推荐的真实数据来源：

```text
阳光高考院校库：https://gaokao.chsi.com.cn/sch/
阳光高考专业库：https://gaokao.chsi.com.cn/zyk/zybk/
阳光高考招生章程：https://gaokao.chsi.com.cn/zsgs/zhangcheng/
各省教育考试院：一分一段表、招生计划、投档线、录取结果
学校本科招生网：分省分专业录取数据、招生计划、就业质量报告
```

## Render 重新部署

把修改后的文件上传或推送到 GitHub 后，Render 通常会自动重新部署。也可以进入 Render 服务页面点击 `Manual Deploy`。

保持当前配置：

```text
Build Command: npm install --no-audit --no-fund && npm run build
Start Command: npm start
Environment Variable: NODE_VERSION=22.12.0
```
