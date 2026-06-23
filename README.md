# 高考志愿 AI 推荐 Web 应用

本项目使用 React + Vite 构建前端，Express 提供 REST API，mock 数据模拟 `school` 与 `admission_stats` 两张表。

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
