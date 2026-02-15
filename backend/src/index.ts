import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = parseInt(process.env.PORT || "4000", 10);

app.listen(PORT, () => {
  console.log(`[MinePanel Backend] Running on http://localhost:${PORT}`);
  console.log(`[MinePanel Backend] Plugin proxy: ${process.env.PLUGIN_BASE_URL || "http://127.0.0.1:8765"}`);
});
