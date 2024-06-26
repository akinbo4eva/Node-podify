import express from "express";
import "dotenv/config";
import "./db";
import authRouter from "./routers/auth";
import audioRouter from "./routers/audio";
import favoriteRouter from "./routers/favorite";

const app = express();

// regiter our middleware +++++
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("src/public"));
// +++++

app.use("/auth", authRouter);
app.use("/audio", audioRouter);
app.use("/favorite", favoriteRouter);

const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log("I am listening on port" + PORT);
});
