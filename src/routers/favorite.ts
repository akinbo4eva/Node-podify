import { toggleFavorite } from "#/controllers/favorite";
import { isVerified, mustAuth } from "#/middleware/auth";
import { Router } from "express";

const router = Router();

router.post("/", mustAuth, isVerified, toggleFavorite)
// conditions 
// audio is already in fav
// trying to create new fav list
// trying to add new audio to the existing fav list

export default router;
