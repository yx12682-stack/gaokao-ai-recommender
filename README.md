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

## 学校优先决策流程

产品现在采用“先看学校，再定专业”的决策路径：

1. 输入高考分数或位次、省份、科类、城市偏好和风险偏好。
2. 先生成可达学校池，按冲刺、稳妥、保底展示学校梯度。
3. 点击学校进入详情，查看学校层次、所在地、办学类型、优势学科、特色专业、校园与就业特点。
4. 在学校详情里阅读可选专业的通俗解释、核心课程、适合学生、就业方向、代表职业、行业前景、考研方向和风险提醒。
5. 查看相似位次录取去向：系统基于公开录取数据聚合学校、专业、城市和学校专业组合分布，不使用个人学生记录。
6. 选择学校和校内专业后，生成最终 6 / 6 / 4 志愿表。

专业偏好可以先留空。系统会先回答“这个分数和位次可能去哪些学校”，再帮助学生和家长理解这些学校里有哪些专业、这些专业大致做什么、未来可能走向哪里。

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
专业偏好：全国本科专业目录，可搜索选择，也可先留空
学校池：先按冲刺、稳妥、保底展示可达学校
学校详情：点击推荐卡片中的学校名称或详情按钮打开预览
专业说明：在学校详情中查看通俗解释、就业方向、职业选择和风险提醒
决策驾驶舱：展示风险分布、城市分布、专业分布和相似位次去向信号
```

## 核心模型

```text
gap = student_rank - school_avg_rank
z = gap / school_std
probability = 1 / (1 + exp(-k * z))
```

因为排名数值越小代表位次越靠前，当前实现使用负向 `k`，再叠加专业热度、地区竞争、年份趋势、城市偏好和风险偏好的修正因子。

## 真实数据政策

系统不能伪造官方录取数据。

当前仓库内置的是来源可追踪的示例结构数据，用于验证产品流程、概率模型、导入结构和界面交互。它不等同于全国真实录取结果，也不能直接作为正式填报依据。

允许接入的权威数据来源包括：

```text
各省教育考试院：一分一段表、招生计划、投档线、录取结果
阳光高考：院校库、专业库、招生章程、招生计划入口
学校本科招生网：分省分专业录取数据、招生计划、招生章程
学校就业质量报告：就业地区、行业、升学、签约等就业证据
```

当某省、某校、某专业缺少已导入并核验的权威数据时，页面会标注为 `sample`、`partial`、`missing` 或 `stale`，而不是伪装成真实结论。正式使用前必须导入并核验各省教育考试院、阳光高考和学校招生网的数据。

## REST API

核心兼容接口：

```text
POST /recommend
```

学校优先流程接口：

```text
POST /schools/reachable
GET /schools/:schoolId
GET /schools/:schoolId/majors?province=北京&subject=physics&rank=2600
GET /majors/:majorName
POST /plans/volunteer
POST /cohort-outcomes
```

数据与来源接口：

```text
GET /catalog/majors?query=计算机
GET /source-registry
GET /data-coverage
GET /data-sources
POST /data/import  # admin only, requires DATA_IMPORT_TOKEN
GET /health
```

## 真实数据导入

查看数据覆盖率：

```bash
curl http://localhost:3001/data-coverage
```

查看当前数据来源：

```bash
curl http://localhost:3001/data-sources
```

导入权威录取数据前，先在后端环境中配置管理员令牌：

```bash
export DATA_IMPORT_TOKEN="replace-with-a-long-private-token"
```

不配置 `DATA_IMPORT_TOKEN` 时，`POST /data/import` 会返回 `DATA_IMPORT_DISABLED`，避免公开 Render 站点被外部写入数据。令牌只放在服务端环境变量里，不要写入前端代码。

导入权威录取数据：

```bash
curl -X POST http://localhost:3001/data/import \
  -H "Content-Type: application/json" \
  -H "x-admin-token: replace-with-a-long-private-token" \
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
Optional Admin Import Variable: DATA_IMPORT_TOKEN=<仅管理员保存的长随机令牌>
```

重新部署检查清单：

```text
1. 把最新代码上传或推送到 GitHub 仓库 yx12682-stack/gaokao-ai-recommender。
2. 打开 Render 服务 gaokao-ai-recommender。
3. 如果没有自动部署，点击 Manual Deploy -> Deploy latest commit。
4. 等待状态变为 Live。
5. 打开 https://gaokao-ai-recommender.onrender.com。
6. 确认首页标题为“先看学校，再定专业”，可以生成学校池，并能打开学校详情查看专业解释。
```
