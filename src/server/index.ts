import { createRecommendApp } from "./app";

const port = Number(process.env.PORT ?? 3001);
const app = createRecommendApp();

app.listen(port, () => {
  console.log(`Recommend API listening on http://localhost:${port}`);
});
